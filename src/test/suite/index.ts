import * as path from 'path';
import * as Mocha from 'mocha';
import * as glob from 'glob';
import * as paths from "path";
import * as fs from "fs";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const istanbul = require("istanbul");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const remapIstanbul = require("remap-istanbul");

function _mkDirIfExists(dir: string): void {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
}

function _readCoverOptions(testsRoot: string): ITestRunnerOptions | undefined {
    const coverConfigPath = paths.join(testsRoot, "..", "..", "coverconfig.json");
    let coverConfig: ITestRunnerOptions | undefined = undefined;
    if (fs.existsSync(coverConfigPath)) {
        const configContent = fs.readFileSync(coverConfigPath, "utf-8");
        coverConfig = JSON.parse(configContent);
    }
    return coverConfig;
}

export function run(_testsRoot: string, clb: any): Promise<void> {
    // Create the mocha test
    const mocha = new Mocha({
        ui: 'bdd',
        reporter: 'mocha-multi-reporters',
        reporterOptions: {
            reporterEnabled: "spec, mocha-junit-reporter",
            mochaJunitReporterReporterOptions: {
                mochaFile: paths.join(_testsRoot, "..", "..", "test-results.xml")
            }
        },
        color: true,
        timeout: 60000
    });

    const testsRoot = path.resolve(__dirname, '..');

    return new Promise((c, e) => {
        // Read configuration for the coverage file
        const coverOptions: ITestRunnerOptions | undefined = _readCoverOptions(testsRoot);
        if (coverOptions && coverOptions.enabled) {
            // Setup coverage pre-test, including post-test hook to report
            const coverageRunner = new CoverageRunner(coverOptions, testsRoot, clb);
            coverageRunner.setupCoverage();
        }

        glob('**/**.test.js', { cwd: testsRoot }, (err, files) => {
            if (err) {
                return e(err);
            }

            // Add files to the test suite
            files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

            try {
                // Run the mocha test
                mocha.run(failures => {
                    if (failures > 0) {
                        e(new Error(`${failures} tests failed.`));
                    } else {
                        c();
                    }
                });
            } catch (error) {
                e(error);
            }
        });
    });
}
interface ITestRunnerOptions {
    enabled?: boolean;
    relativeCoverageDir: string;
    relativeSourcePath: string;
    ignorePatterns: string[];
    includePid?: boolean;
    reports?: string[];
    verbose?: boolean;
}

class CoverageRunner {

    private coverageVar: string = "$$cov_" + new Date().getTime() + "$$";
    private transformer: any = undefined;
    private matchFn: any = undefined;
    private instrumenter: any = undefined;

    constructor(private options: ITestRunnerOptions, private testsRoot: string, endRunCallback: (error: string) => void) {
        if (!options.relativeSourcePath) {
            endRunCallback("Error - relativeSourcePath must be defined for code coverage to work");
        }

    }

    public setupCoverage(): void {
        // Set up Code Coverage, hooking require so that instrumented code is returned
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        self.instrumenter = new istanbul.Instrumenter({ coverageVariable: self.coverageVar });
        const sourceRoot = paths.join(self.testsRoot, self.options.relativeSourcePath);

        // Glob source files
        const srcFiles = glob.sync("**/**.js", {
            cwd: sourceRoot,
            ignore: self.options.ignorePatterns,
        });

        // Create a match function - taken from the run-with-cover.js in istanbul.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const decache = require("decache");
        const fileMap = new Map<string, boolean>();
        srcFiles.forEach((file) => {
            const fullPath = paths.join(sourceRoot, file);
            fileMap.set(fullPath, true);

            // On Windows, extension is loaded pre-test hooks and this mean we lose
            // our chance to hook the Require call. In order to instrument the code
            // we have to decache the JS file so on next load it gets instrumented.
            // This doesn't impact tests, but is a concern if we had some integration
            // tests that relied on VSCode accessing our module since there could be
            // some shared global state that we lose.
            decache(fullPath);
        });

        self.matchFn = (file: string): boolean | undefined => { return fileMap.get(file); };
        self.matchFn.files = Object.keys(fileMap);

        // Hook up to the Require function so that when this is called, if any of our source files
        // are required, the instrumented version is pulled in instead. These instrumented versions
        // write to a global coverage variable with hit counts whenever they are accessed
        self.transformer = self.instrumenter.instrumentSync.bind(self.instrumenter);
        const hookOpts = { verbose: false, extensions: [".js"] };
        istanbul.hook.hookRequire(self.matchFn, self.transformer, hookOpts);

        // initialize the global variable to stop mocha from complaining about leaks
        const lGlobal: any = global;
        lGlobal[self.coverageVar] = {};

        // Hook the process exit event to handle reporting
        // Only report coverage if the process is exiting successfully
        process.on("exit", (code: any) => {
            self.reportCoverage();
        });
    }

    /**
     * Writes a coverage report. Note that as this is called in the process exit callback, all calls must be synchronous.
     *
     * @returns {void}
     *
     * @memberOf CoverageRunner
     */
    public reportCoverage(): void {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        istanbul.hook.unhookRequire();
        let cov: any;
        const lGlobal: any = global;
        if (typeof lGlobal[self.coverageVar] === "undefined" || Object.keys(lGlobal[self.coverageVar]).length === 0) {
            console.error("No coverage information was collected, exit without writing coverage information");
            return;
        } else {
            cov = lGlobal[self.coverageVar];
        }

        // TODO consider putting this under a conditional flag
        // Files that are not touched by code ran by the test runner is manually instrumented, to
        // illustrate the missing coverage.
        self.matchFn.files.forEach((file: string) => {
            if (!cov[file]) {
                self.transformer(fs.readFileSync(file, "utf-8"), file);

                // When instrumenting the code, istanbul will give each FunctionDeclaration a value of 1 in coverState.s,
                // presumably to compensate for function hoisting. We need to reset this, as the function was not hoisted,
                // as it was never loaded.
                Object.keys(self.instrumenter.coverState.s).forEach((key) => {
                    self.instrumenter.coverState.s[key] = 0;
                });

                cov[file] = self.instrumenter.coverState;
            }
        });

        // TODO Allow config of reporting directory with
        const reportingDir = paths.join(self.testsRoot, self.options.relativeCoverageDir);
        const includePid = self.options.includePid;
        const pidExt = includePid ? ("-" + process.pid) : "";
        const coverageFile = paths.resolve(reportingDir, "coverage" + pidExt + ".json");

        _mkDirIfExists(reportingDir); // yes, do this again since some test runners could clean the dir initially created

        fs.writeFileSync(coverageFile, JSON.stringify(cov), "utf8");

        const remappedCollector = remapIstanbul.remap(cov, {
            warn: (warning: any) => {
                // We expect some warnings as any JS file without a typescript mapping will cause this.
                // By default, we"ll skip printing these to the console as it clutters it up
                if (self.options.verbose) {
                    console.warn(warning);
                }
            }
        });

        const reporter = new istanbul.Reporter(undefined, reportingDir);
        const reportTypes = (self.options.reports instanceof Array) ? self.options.reports : ["lcov", "cobertura"];
        reporter.addAll(reportTypes);
        reporter.write(remappedCollector, true, () => {
            console.log(`reports written to ${reportingDir}`);
        });
    }
}