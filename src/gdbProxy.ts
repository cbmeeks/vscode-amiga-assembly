import { Socket } from 'net';
//import { readFileSync } from 'fs';
import { EventEmitter } from 'events';
//import { resolve } from 'dns';

export interface GdbBreakpoint {
    id: number;
    segmentId: number;
    offset: number;
    verified: boolean;
}

export interface GdbStackPosition {
    index: number;
    segmentId: number;
    offset: number;
}

export interface GdbStackFrame {
    frames: Array<GdbStackPosition>;
    count: number;
}

export interface GdbRegister {
    name: string;
    value: number;
}

export interface Segment {
    address: number;
    size: number;
}

export enum GdbPacketType {
    ERROR,
    REGISTER,
    MEMORY,
    SEGMENT,
    END,
    STOP,
    UNKNOWN,
    OK,
    PLUS
}
export interface GdbPacket {
    type: GdbPacketType;
    command?: string;
    message: string;
}

export class GdbProxy extends EventEmitter {
    // Socket to connect
    private socket: Socket;
    // break point id counter
    private nextBreakPointId = 0;
    /** Current source file */
    private programFilename?: string;
    /** Segmentes of memory */
    private segments?: Array<Segment>;
    /** Breakpoints selected */
    private breakPoints = new Array<GdbBreakpoint>();
    /** Pending breakpoint no yet sent to debuger */
    private pendingBreakpoints: Array<GdbBreakpoint> | null = null;
    /** Current frames */
    private frames = new Array<GdbStackPosition>();
    /** Stop on entry asked */
    private stopOnEntryRequested = false;

    constructor() {
        super();
        this.socket = new Socket();
    }

    public connect(host: string, port: number): Promise<void> {
        let self = this;
        return new Promise((resolve, reject) => {
            self.socket.connect(port, host);
            self.socket.once('connect', () => {
                return self.sendPacketString('QStartNoAckMode').then(function (data: any) {
                    if (self.pendingBreakpoints) {
                        let pending = self.pendingBreakpoints;
                        self.pendingBreakpoints = null;
                        let promises: Promise<GdbBreakpoint>[] = pending.map(bp => {
                            return self.setBreakPoint(0, 0);
                        });
                        Promise.all(promises).then(() => {
                            self.sendEvent("connect");
                            resolve();
                        });
                    } else {
                        resolve();
                    }
                });
            });
            self.socket.once('error', (err) => {
                self.sendEvent("error", err);
                reject(err);
            });
            self.socket.on("data", (data) => { this.onData(this, data); });
        });
    }
    public destroy(): void {
        this.socket.destroy();
    }

    protected static parseType(message: string): GdbPacketType {
        if (message.startsWith("OK")) {
            return GdbPacketType.OK;
        } else if (message.startsWith("+")) {
            return GdbPacketType.PLUS;
        } else if (message.startsWith("AS")) {
            return GdbPacketType.REGISTER;
        } else if (message.startsWith("E")) {
            return GdbPacketType.ERROR;
        } else if (message.startsWith("S")) {
            return GdbPacketType.STOP;
        } else if (message.startsWith("W")) {
            return GdbPacketType.END;
        }
        return GdbPacketType.UNKNOWN;
    }

    protected static parseData(data: any): GdbPacket[] {
        let s = data.toString();
        let messageRegexp = /\$([a-z\d;:/\\.]+)\#[\da-f]{2}/gi;
        let match;
        let parsedData = new Array<GdbPacket>();
        while (match = messageRegexp.exec(s)) {
            let message = GdbProxy.extractPacket(match[1]);
            parsedData.push(<GdbPacket>{
                type: GdbProxy.parseType(message),
                message: message
            });
        }
        return parsedData;
    }

    private onData(proxy: GdbProxy, data: any) {
        console.log("onData : " + data.toString());
        for (let packet of GdbProxy.parseData(data)) {
            switch (packet.type) {
                case GdbPacketType.REGISTER:
                    this.parseSegments(packet.message);
                    break;
                case GdbPacketType.ERROR:
                    this.parseError(packet.message);
                    break;
                case GdbPacketType.STOP:
                    this.parseStop(packet.message);
                    break;
                case GdbPacketType.END:
                    this.sendEvent(packet.message);
                    break;
                case GdbPacketType.OK:
                case GdbPacketType.PLUS:
                    break;
                case GdbPacketType.UNKNOWN:
                default:
                    console.info("Packet ignored : " + packet.message);
                    break;
            }
        }
    }

    protected responseHasNoError(data: any): boolean {
        let packets = GdbProxy.parseData(data);
        for (let packet of packets) {
            if (packet.type === GdbPacketType.ERROR) {
                return false;
            }
        }
        return true;
    }

    public load(programFilename: string, stopOnEntry: boolean | undefined) {
        if (this.programFilename !== programFilename) {
            this.programFilename = programFilename;
            let elms = this.programFilename.replace('\\', '/').split('/');
            if (stopOnEntry) {
                this.sendPacketString("Z0,0,0").then(data => {
                    //console.log("load : " + data.toString());
                    let self = this;
                    if (data.toString().indexOf('OK') > 0) {
                        // Let fs-uae terminate before sending the run command
                        // TODO : is this necessary ???
                        setTimeout(function () {
                            self.stopOnEntryRequested = true;
                            self.sendPacketString("vRun;dh0:" + elms[elms.length - 1] + ";");
                        }, 100);
                    } else {
                        // TODO Affichage de l'erreur
                    }
                });
            } else {
                this.sendPacketString("vRun;dh0:" + elms[elms.length - 1] + ";").then(data => {
                    if (this.responseHasNoError(data)) {
                        this.sendAllPendingBreakpoints();
                    }
                });
            }
        }
    }

    public calculateChecksum(text: string): string {
        let cs = 0;
        var buffer = new Buffer(text);
        for (let i = 0; i < buffer.length; ++i) {
            cs += buffer[i];
        }
        cs = cs % 256;
        let s = cs.toString(16);
        if (s.length < 2) {
            return "0" + s;
        } else {
            return s;
        }
    }

    public sendPacketString(text: string): Promise<any> {
        return new Promise((resolve, reject) => {
            var data = new Buffer(text.length + 5);
            let offset = 0;
            data.write('$', offset++);
            data.write(text, offset);
            offset += text.length;
            data.write('#', offset++);
            data.write(this.calculateChecksum(text), offset);
            offset += 2;
            data.writeInt8(0, offset);
            console.log(" --->" + data.toString());
            this.socket.write(data);
            this.socket.once('data', (data) => {
                resolve(data);
                if (data.toString().endsWith('exit')) {
                    this.socket.destroy();
                }
            });
            this.socket.once('error', (err) => {
                reject(err);
            });
        });
    }

    public setBreakPoint(segmentId: number, offset: number): Promise<GdbBreakpoint> {
        let self = this;
        if (((this.segments) || ((segmentId === 0) && (offset === 0))) && (this.socket.writable)) {
            if (this.segments && (segmentId > this.segments.length)) {
                return Promise.reject("Invalid breakpoint segment id");
            } else {
                let newOffset = 0;
                if (this.segments) {
                    newOffset = this.toAbsoluteOffset(segmentId, offset);
                }
                return this.sendPacketString('Z0,' + newOffset + ',0').then(function (data) {
                    //console.log("setBreakPoint :" + data.toString());
                    let bp = <GdbBreakpoint>{
                        verified: true,
                        segmentId: segmentId,
                        offset: offset,
                        id: self.nextBreakPointId++
                    };
                    self.breakPoints.push(bp);
                    self.sendEvent("breakpointValidated", bp);
                    return bp;
                });
            }
        } else {
            let bp = <GdbBreakpoint>{
                verified: false,
                segmentId: segmentId,
                offset: offset,
                id: self.nextBreakPointId++
            };
            if (!this.pendingBreakpoints) {
                this.pendingBreakpoints = new Array<GdbBreakpoint>();
            }
            this.pendingBreakpoints.push(bp);
            return Promise.resolve(bp);
        }
    }

    public sendAllPendingBreakpoints(): Promise<GdbBreakpoint[]> {
        if ((this.pendingBreakpoints) && this.pendingBreakpoints.length > 0) {
            let pending = this.pendingBreakpoints;
            this.pendingBreakpoints = new Array<GdbBreakpoint>();
            let promises: Promise<GdbBreakpoint>[] = [];
            for (let bp of pending) {
                promises.push(this.setBreakPoint(bp.segmentId, bp.offset).then(bp => {
                    return bp;
                }));
            }
            return Promise.all(promises);
        } else {
            return Promise.resolve([]);
        }
    }

    public clearBreakpoints(path: string) {

    }

    public stack(): GdbStackFrame {
        return {
            frames: this.frames,
            count: this.frames.length
        };
    }

    public continue() {
        // TODO : continue
        this.sendPacketString('n');
    }

    public step() {
        this.sendPacketString('n');
    }

    public registers(): Promise<Array<GdbRegister>> {
        return this.sendPacketString('g').then(data => {
            //console.log("register : " + data.toString());
            let dataStr = GdbProxy.extractPacket(data.toString());
            let registers = new Array<GdbRegister>();
            let pos = 0;
            let letter = 'd';
            let v = "";
            for (let j = 0; j < 2; j++) {
                for (let i = 0; i < 8; i++) {
                    v = dataStr.slice(pos, pos + 8);
                    registers.push({
                        name: letter + i,
                        value: parseInt(v, 16)
                    });
                    pos += 8;
                }
                letter = 'a';
            }
            v = dataStr.slice(pos, pos + 8);
            pos += 8;
            registers.push({
                name: "sr",
                value: parseInt(v, 16)
            });
            v = dataStr.slice(pos, pos + 8);
            pos += 8;
            let pc = parseInt(v, 16);
            registers.push({
                name: "pc",
                value: pc
            });
            this.frames = [];
            let [segmentId, offset] = this.toRelativeOffset(pc);
            this.frames.push(<GdbStackPosition>{
                index: 1,
                segmentId: segmentId,
                offset: offset,
            });
            return registers;
        });
    }

    /**
     * Sends an event
     * @param event Event to send
     * @param args Arguments
     */
    private sendEvent(event: string, ...args: any[]) {
        setImmediate(_ => {
            this.emit(event, ...args);
        });
    }

    /**
     * Parse of the segment message :
     *          AS;addr;size;add2;size
     * @param segmentReply The message containing the segments
     */
    protected parseSegments(segmentReply: string) {
        let segs = segmentReply.split(";");
        this.segments = new Array<Segment>();
        // The segments message begins with the keyword AS
        for (let i = 1; i < segs.length - 1; i += 2) {
            let address = segs[i];
            let size = segs[i + 1];
            this.segments.push(<Segment>{
                address: parseInt(address),
                size: parseInt(size),
            });
        }
        this.sendEvent("segmentsUpdated", this.segments);
    }

    protected parseStop(message: string) {
        // Retrieve the cause
        let sid = message.split(';')[0];
        let n = parseInt(sid.substring(1), 16);
        switch (n) {
            case 5:
                // A breakpoint has been reached
                this.registers().then((registers: Array<GdbRegister>) => {
                    if (this.stopOnEntryRequested) {
                        this.stopOnEntryRequested = false;
                        this.sendEvent('stopOnEntry');
                    } else {
                        this.sendEvent('stopOnBreakpoint');
                    }
                });
                break;
            default:
                break;
        }
    }

    protected askForStatus() {
        this.sendPacketString('?');
    }

    protected static extractPacket(message: string): string {
        if (message.startsWith('$')) {
            let pos = message.indexOf('#');
            if (pos > 0) {
                return message.substring(1, pos);
            }
        }
        return message;
    }

    /**
     * Parsing an error message
     * @param message Error message
     */
    protected parseError(message: string) {
        this.sendEvent('error', message);
    }

    public toRelativeOffset(offset: number): [number, number] {
        if (this.segments) {
            let segmentId = 0;
            for (let segment of this.segments) {
                if ((offset >= (segment.address - 4)) && (offset <= segment.address + segment.size)) {
                    return [segmentId, offset - segment.address - 4];
                }
                segmentId++;
            }
        }
        return [0, offset];
    }
    public toAbsoluteOffset(segmentId: number, offset: number): number {
        if (this.segments) {
            if (segmentId < this.segments.length) {
                return segmentId + offset + 4;
            }
        }
        return offset;
    }
}

