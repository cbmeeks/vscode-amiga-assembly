import { Mutex } from "./mutex";
import { BreakpointsChangeEvent } from 'vscode';
import { DebugProtocol } from 'vscode-debugprotocol/lib/debugProtocol';
import { DebugDisassembledFile, DebugDisassembledManager } from "./debugDisassembled";
import { DebugInfo } from "./debugInfo";
import { GdbProxy } from "./gdbProxy";
import { ExtensionState } from "./extension";
import winston = require('winston');

/**
 * Class to contact the fs-UAE GDB server.
 */
export class BreakpointManager {
    /** Storage prefix for keys*/
    static readonly STORAGE_PREFIX = "amiga.assembly";
    /** Storage prefix for keys*/
    static readonly STORAGE_DATA_LIST = `${BreakpointManager.STORAGE_PREFIX}.dataBreakpointsList`;
    /** List of stored breakpoints */
    private static storedDataBreakpointsList?: Array<string>;
    /** Default selection mask for exception : each bit is a exception code */
    static readonly DEFAULT_EXCEPTION_MASK = 0b111100;
    /** exception mask */
    private exceptionMask = BreakpointManager.DEFAULT_EXCEPTION_MASK;
    /** Proxy to Gdb */
    private gdbProxy: GdbProxy;
    /** Breakpoints selected */
    private breakpoints = new Array<GdbBreakpoint>();
    /** Pending breakpoint no yet sent to debugger */
    private pendingBreakpoints = new Array<GdbBreakpoint>();
    /** Debug information for the loaded program */
    private debugInfo?: DebugInfo;
    /** Manager of disassembled code */
    private debugDisassembledManager: DebugDisassembledManager;
    /** Next breakpoint id */
    private nextBreakpointId = 0;
    /** Temporary breakpoints arrays */
    private temporaryBreakpointArrays = new Array<GdbTemporaryBreakpointArray>();
    /** Mutex to just have one call to gdb */
    protected mutex = new Mutex(100, 180000);
    /** Lock for breakpoint management function */
    protected breakpointLock?: () => void;

    public constructor(gdbProxy: GdbProxy, debugDisassembledManager: DebugDisassembledManager) {
        this.gdbProxy = gdbProxy;
        this.debugDisassembledManager = debugDisassembledManager;
        this.gdbProxy.setSendPendingBreakpointsCallback(this.sendAllPendingBreakpoint);
    }

    public setExceptionMask(exceptionMask: number): void {
        this.exceptionMask = exceptionMask;
    }

    public setDebugInfo(debugInfo: DebugInfo): void {
        this.debugInfo = debugInfo;
    }

    /**
     * Set the mutex timeout
     * @param timeout Mutex timeout
     */
    public setMutexTimeout(timeout: number): void {
        this.mutex = new Mutex(100, timeout);
    }

    public addPendingBreakpoint(breakpoint: GdbBreakpoint, err?: Error): void {
        breakpoint.verified = false;
        if (err) {
            breakpoint.message = err.message;
        }
        this.pendingBreakpoints.push(breakpoint);
    }

    private async fillBreakpointWithSegAddress(debugBp: GdbBreakpoint, path: string, line: number): Promise<boolean> {
        if (this.debugInfo) {
            const values = await this.debugInfo.getAddressSeg(path, line);
            if (values) {
                debugBp.segmentId = values[0];
                debugBp.offset = values[1];
                return true;
            }
        }
        return false;
    }

    public async checkPendingBreakpointsAddresses(): Promise<void> {
        if (this.debugInfo) {
            for (const debugBp of this.pendingBreakpoints) {
                if (debugBp.source && debugBp.line) {
                    const path = <string>debugBp.source.path;
                    if (!DebugDisassembledFile.isDebugAsmFile(path)) {
                        await this.fillBreakpointWithSegAddress(debugBp, path, debugBp.line);
                    }
                }
            }
        }
    }

    public async setBreakpoint(debugBp: GdbBreakpoint): Promise<GdbBreakpoint> {
        try {
            if (debugBp.source && debugBp.line && (debugBp.id !== undefined)) {
                debugBp.verified = false;
                const path = <string>debugBp.source.path;

                if (!DebugDisassembledFile.isDebugAsmFile(path)) {
                    if (this.debugInfo) {
                        if (await this.fillBreakpointWithSegAddress(debugBp, path, debugBp.line)) {
                            await this.gdbProxy.setBreakpoint(debugBp);
                            this.breakpoints.push(debugBp);
                        } else {
                            throw new Error("Segment offset not resolved");
                        }
                    } else {
                        throw new Error("Debug information not retrieved");
                    }
                } else {
                    const name = <string>debugBp.source.name;
                    const address = await this.debugDisassembledManager.getAddressForFileEditorLine(name, debugBp.line);
                    debugBp.segmentId = undefined;
                    debugBp.offset = address;
                    await this.gdbProxy.setBreakpoint(debugBp);
                    this.breakpoints.push(debugBp);
                }
            } else if (debugBp.exceptionMask !== undefined || (debugBp.size && debugBp.size > 0 && this.gdbProxy.isConnected())) {
                await this.gdbProxy.setBreakpoint(debugBp);
                if (debugBp.exceptionMask === undefined) {
                    this.breakpoints.push(debugBp);
                }
            } else {
                throw new Error("Breakpoint info incomplete");
            }
        } catch (error) {
            this.addPendingBreakpoint(debugBp, error);
            throw error;
        }
        return debugBp;
    }

    public createBreakpoint(source: DebugProtocol.Source, line: number): GdbBreakpoint {
        return <GdbBreakpoint>{
            id: this.nextBreakpointId++,
            line: line,
            source: source,
            verified: false
        };
    }

    public createTemporaryBreakpoint(address: number): GdbBreakpoint {
        return <GdbBreakpoint>{
            id: this.nextBreakpointId++,
            segmentId: undefined,
            offset: address,
            temporary: true,
            verified: false
        };
    }

    public createDataBreakpoint(address: number, size: number, accessType: string | undefined, message: string | undefined): GdbBreakpoint {
        let gdbAccessType: GdbBreakpointAccessType;
        switch (accessType) {
            case GdbBreakpointAccessType.READ:
                gdbAccessType = GdbBreakpointAccessType.READ;
                break;
            case GdbBreakpointAccessType.WRITE:
                gdbAccessType = GdbBreakpointAccessType.WRITE;
                break;
            case GdbBreakpointAccessType.READWRITE:
                gdbAccessType = GdbBreakpointAccessType.READWRITE;
                break;
            default:
                gdbAccessType = GdbBreakpointAccessType.READWRITE;
                break;
        }
        return <GdbBreakpoint>{
            id: this.nextBreakpointId++,
            segmentId: undefined,
            offset: address,
            verified: false,
            size: size,
            accessType: gdbAccessType,
            message: message,
            defaultMessage: message,
        };
    }

    public async addTemporaryBreakpointArray(temporaryBreakpointArray: GdbTemporaryBreakpointArray): Promise<void> {
        this.temporaryBreakpointArrays.push(temporaryBreakpointArray);
        for (const debugBp of temporaryBreakpointArray.breakpoints) {
            await this.gdbProxy.setBreakpoint(debugBp);
        }
    }

    public async removeTemporaryBreakpointArray(temporaryBreakpointArray: GdbTemporaryBreakpointArray): Promise<void> {
        try {
            this.breakpointLock = await this.mutex.capture('breakpointLock');
            for (const debugBp of temporaryBreakpointArray.breakpoints) {
                await this.gdbProxy.removeBreakpoint(debugBp);
            }
            this.temporaryBreakpointArrays = this.temporaryBreakpointArrays.filter(item => item !== temporaryBreakpointArray);
        } finally {
            if (this.breakpointLock) {
                this.breakpointLock();
                this.breakpointLock = undefined;
            }
        }
    }

    public createTemporaryBreakpointArray(offsets: Array<number>): GdbTemporaryBreakpointArray {
        const tempArray = new GdbTemporaryBreakpointArray();
        for (const addr of offsets) {
            const debugBp = this.createTemporaryBreakpoint(addr);
            tempArray.addBreakpoint(debugBp);
        }
        return tempArray;
    }

    public async checkTemporaryBreakpoints(pc: number): Promise<void> {
        const arraysToRemove = new Array<GdbTemporaryBreakpointArray>();
        for (const tempArray of this.temporaryBreakpointArrays) {
            for (const bp of tempArray.breakpoints) {
                if (bp.offset === pc) {
                    arraysToRemove.push(tempArray);
                }
            }
        }
        for (const tempArray of arraysToRemove) {
            await this.removeTemporaryBreakpointArray(tempArray);
        }
    }


    public createExceptionBreakpoint(): GdbBreakpoint {
        return <GdbBreakpoint>{
            id: this.nextBreakpointId++,
            exceptionMask: this.exceptionMask,
            verified: false
        };
    }

    public sendAllPendingBreakpoint = async (): Promise<void> => {
        this.breakpointLock = await this.mutex.capture('breakpointLock');
        if ((this.pendingBreakpoints) && this.pendingBreakpoints.length > 0) {
            const pending = this.pendingBreakpoints;
            this.pendingBreakpoints = new Array<GdbBreakpoint>();
            for (const bp of pending) {
                try {
                    await this.setBreakpoint(bp);
                } catch (error) {
                    //nothing to do - the breakpoint was already added to the pending list
                }
            }
        }
        if (this.breakpointLock) {
            this.breakpointLock();
            this.breakpointLock = undefined;
        }
    }

    /**
     * Ask for an exception breakpoint
     */
    public setExceptionBreakpoint(): Promise<GdbBreakpoint> {
        const breakpoint = this.createExceptionBreakpoint();
        return this.setBreakpoint(breakpoint);
    }

    /**
     * Ask to remove an exception breakpoint
     */
    public async removeExceptionBreakpoint(): Promise<void> {
        this.breakpointLock = await this.mutex.capture('breakpointLock');
        const breakpoint = this.createExceptionBreakpoint();
        try {
            await this.gdbProxy.removeBreakpoint(breakpoint);
        } finally {
            if (this.breakpointLock) {
                this.breakpointLock();
                this.breakpointLock = undefined;
            }
        }
    }

    private isSameSource(source: DebugProtocol.Source, other: DebugProtocol.Source): boolean {
        const path = source.path;
        if (path) {
            return ((source.path === other.path) ||
                (DebugDisassembledFile.isDebugAsmFile(path) && source.name === other.name));
        }
        return source.path === other.path;
    }

    public async clearBreakpointsInner(source: DebugProtocol.Source | null, clearDataBreakpoint: boolean): Promise<void> {
        let hasError = false;
        const remainingBreakpoints = new Array<GdbBreakpoint>();
        this.breakpointLock = await this.mutex.capture('breakpointLock');
        for (const bp of this.breakpoints) {
            if ((source && bp.source && this.isSameSource(bp.source, source) && !clearDataBreakpoint && bp.accessType === undefined) || (clearDataBreakpoint && bp.accessType !== undefined)) {
                try {
                    await this.gdbProxy.removeBreakpoint(bp);
                } catch (err) {
                    remainingBreakpoints.push(bp);
                    hasError = true;
                }
            } else {
                remainingBreakpoints.push(bp);
            }
        }
        this.breakpoints = remainingBreakpoints;
        if (this.breakpointLock) {
            this.breakpointLock();
            this.breakpointLock = undefined;
        }
        if (hasError) {
            throw new Error("Some breakpoints cannot be removed");
        }
    }

    public clearBreakpoints(source: DebugProtocol.Source): Promise<void> {
        return this.clearBreakpointsInner(source, false);
    }
    public clearDataBreakpoints(): Promise<void> {
        return this.clearBreakpointsInner(null, true);
    }

    public getPendingBreakpoints(): Array<GdbBreakpoint> {
        return this.pendingBreakpoints;
    }

    public populateDataBreakpointInfoResponseBody(response: DebugProtocol.DataBreakpointInfoResponse, variableName: string, address: string, isRegister: boolean) {
        let variableDisplay;
        if (isRegister) {
            variableDisplay = `${address}`;
        } else {
            variableDisplay = `${variableName}(${address})`;
        }
        response.body = {
            dataId: `${variableName}(${address})`,
            description: variableDisplay,
            accessTypes: ["read", "write", "readWrite"],
            canPersist: true
        }
    }

    public parseDataIdAddress(dataId: string): [string, string, number] {
        const elements = dataId.split(/[()]/);
        if (elements.length > 1) {
            return [elements[0], elements[1], parseInt(elements[1])];
        } else {
            throw new Error("DataId format invalid");
        }
    }

    public static loadStoredDataBreakpoints() {
        if (!BreakpointManager.storedDataBreakpointsList) {
            BreakpointManager.storedDataBreakpointsList = ExtensionState.getCurrent().getExtensionContext()?.workspaceState.get<Array<string>>(BreakpointManager.STORAGE_DATA_LIST);
            if (!BreakpointManager.storedDataBreakpointsList) {
                BreakpointManager.storedDataBreakpointsList = new Array<string>();
            }
            winston.info("[BreakpointManager] Loading data breakpoints keys");
            for (const k of BreakpointManager.storedDataBreakpointsList) {
                winston.info(`[BreakpointManager] index breakpoint : ${k}`);
            }
        }
    }

    private static saveStoredDataBreakpoints(list: Array<string>) {
        ExtensionState.getCurrent().getExtensionContext()?.workspaceState.update(BreakpointManager.STORAGE_DATA_LIST, list);
        winston.info("[BreakpointManager] Saving data breakpoints keys");
        for (const k of list) {
            winston.info(`[BreakpointManager] index breakpoint : ${k}`);
        }
    }

    public static addStoredDataBreakpoints(id: string) {
        if (!BreakpointManager.storedDataBreakpointsList) {
            BreakpointManager.storedDataBreakpointsList = new Array<string>();
        }
        if (!BreakpointManager.storedDataBreakpointsList.includes(id)) {
            BreakpointManager.storedDataBreakpointsList.push(id);
        }
        BreakpointManager.saveStoredDataBreakpoints(BreakpointManager.storedDataBreakpointsList);
    }

    public static removeStoredDataBreakpoints(id: string) {
        if (BreakpointManager.storedDataBreakpointsList) {
            BreakpointManager.storedDataBreakpointsList = BreakpointManager.storedDataBreakpointsList?.filter(k => k !== id);
            BreakpointManager.saveStoredDataBreakpoints(BreakpointManager.storedDataBreakpointsList);
        }
    }

    public static removeStoredDataBreakpointsList() {
        BreakpointManager.loadStoredDataBreakpoints();
        if (BreakpointManager.storedDataBreakpointsList) {
            for (const id of BreakpointManager.storedDataBreakpointsList) {
                BreakpointManager.removeSizeForDataBreakpoint(id, true);
            }
            ExtensionState.getCurrent().getExtensionContext()?.workspaceState.update(BreakpointManager.STORAGE_DATA_LIST, undefined);
            BreakpointManager.storedDataBreakpointsList = new Array<string>();
        }
    }

    public static getSizeForDataBreakpoint(bpId: string): number | undefined {
        const id = BreakpointManager.getDataBreakpointStorageId(bpId);
        const size = ExtensionState.getCurrent().getExtensionContext()?.workspaceState.get<number>(id);
        winston.info(`[BreakpointManager] GET size of DataBreakpoint id: ${id}=${size}`);
        return size;
    }
    public static getDataBreakpointStorageId(id: string): string {
        if (id.startsWith(BreakpointManager.STORAGE_PREFIX)) {
            return id;
        }
        return `${BreakpointManager.STORAGE_PREFIX}.${id}`
    }

    public static setSizeForDataBreakpoint(bpId: string, size: number) {
        const id = BreakpointManager.getDataBreakpointStorageId(bpId);
        winston.info(`[BreakpointManager] SET size of DataBreakpoint id: ${id}=${size}`);
        ExtensionState.getCurrent().getExtensionContext()?.workspaceState.update(id, size);
        BreakpointManager.addStoredDataBreakpoints(id);
    }

    public static removeSizeForDataBreakpoint(bpId: string, skipStoringList?: boolean) {
        const id = BreakpointManager.getDataBreakpointStorageId(bpId);
        winston.info(`[BreakpointManager] Removing DataBreakpoint id: ${id}`);
        ExtensionState.getCurrent().getExtensionContext()?.workspaceState.update(id, undefined);
        if (!skipStoringList) {
            BreakpointManager.removeStoredDataBreakpoints(id);
        }
    }

    public static getStoredDataBreakpointsList(): Array<string> | undefined {
        return BreakpointManager.storedDataBreakpointsList;
    }

    private static instanceOfDataBreakpoint(object: any): object is DebugProtocol.DataBreakpoint {
        return 'dataId' in object;
    }

    public static onDidChangeBreakpoints(event: BreakpointsChangeEvent) {
        for (const bp of event.removed) {
            if (BreakpointManager.instanceOfDataBreakpoint(bp)) {
                BreakpointManager.removeSizeForDataBreakpoint(bp.dataId);
            }
        }
    }
}

/** Interface for a breakpoint */
export interface GdbBreakpoint extends DebugProtocol.Breakpoint {
    /** Id for the segment if undefined it is an absolute offset*/
    segmentId?: number;
    /** Offset relative to the segment*/
    offset: number;
    /** exception mask : if present it is an exception breakpoint */
    exceptionMask?: number;
    /** if true it a temporary breakpoint */
    temporary?: boolean;
    /** Size of the memory watched */
    size?: number;
    /** The access type of the data. */
    accessType?: GdbBreakpointAccessType;
    /** default message for the breakpoint */
    defaultMessage: string | undefined;
}

/**
 * Values to the access type of data breakpoint
 */
export enum GdbBreakpointAccessType {
    READ = 'read',
    WRITE = 'write',
    READWRITE = 'readWrite'
}

/**
 * Class to store connected temporary breakpoints
 */
export class GdbTemporaryBreakpointArray {
    public breakpoints = new Array<GdbBreakpoint>();

    /**
     * Adds a breakpoint to the array
     * @param breakpoint Breakpoint to add
     */
    public addBreakpoint(breakpoint: GdbBreakpoint): void {
        this.breakpoints.push(breakpoint);
    }
}
