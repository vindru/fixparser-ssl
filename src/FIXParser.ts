/*
 * fixparser
 * https://gitlab.com/logotype/fixparser.git
 *
 * Copyright 2021 Victor Norgren
 * Released under the MIT license
 */
import { EventEmitter } from 'events';

import * as EncryptMethod from './constants/ConstantsEncryptMethod';
import * as Fields from './constants/ConstantsField';
import * as HandlInst from './constants/ConstantsHandlInst';
import * as Messages from './constants/ConstantsMessage';
import * as OrderTypes from './constants/ConstantsOrderTypes';
import * as Side from './constants/ConstantsSide';
import * as TimeInForce from './constants/ConstantsTimeInForce';
import Field from './fields/Field';
import FIXParserBase from './FIXParserBase';
import FIXParserClientSocket from './handler/FIXParserClientSocket';
import FIXParserClientWebsocket from './handler/FIXParserClientWebsocket';
import Message from './message/Message';
import { timestamp } from './util/util';

type Protocol = 'tcp' | 'websocket';

export default class FIXParser extends EventEmitter {
    public fixParserBase: FIXParserBase = new FIXParserBase();
    public clientHandler:
        | FIXParserClientSocket
        | FIXParserClientWebsocket
        | null = null;
    public host: string | null = null;
    public port: number | null = null;
    public sender: string | null = null;
    public target: string | null = null;
    public messageSequence: number = 1;
    public heartBeatInterval: number | undefined;
    public heartBeatIntervalId: any | null = null;
    public fixVersion: string = 'FIX.5.0SP2';

    public connect({
        host = 'localhost',
        port = 9878,
        protocol = 'tcp',
        sender = 'SENDER',
        target = 'TARGET',
        heartbeatIntervalMs = 30000,
        fixVersion = this.fixVersion,
        key,
        cert
    }: {
        host: string;
        port: number;
        protocol: Protocol;
        sender: string;
        target: string;
        heartbeatIntervalMs: number;
        fixVersion: string;
        cert: any;
        key: any;
    }) {
        if (protocol === 'tcp') {
            this.clientHandler = new FIXParserClientSocket(this, this);
        } else if (protocol === 'websocket') {
            this.clientHandler = new FIXParserClientWebsocket(this, this);
        } else {
            this.clientHandler = new FIXParserClientSocket(this, this);
        }
        this.clientHandler!.host = host;
        this.clientHandler!.port = port;
        this.clientHandler!.sender = sender;
        this.clientHandler!.target = target;
        this.clientHandler!.heartBeatInterval = heartbeatIntervalMs;
        this.clientHandler!.fixVersion = fixVersion;
        this.clientHandler!.key = key;
        this.clientHandler!.cert = cert;
        this.clientHandler!.connect();
    }

    public getNextTargetMsgSeqNum() {
        return this.messageSequence;
    }

    public setNextTargetMsgSeqNum(nextMsgSeqNum: number) {
        this.messageSequence = nextMsgSeqNum;
        return this.messageSequence;
    }

    public getTimestamp(dateObject = new Date()) {
        return timestamp(dateObject);
    }

    public createMessage(...fields: Field[]) {
        return new Message(this.fixVersion, ...fields);
    }

    public parse(data: string): Message[] {
        return this.fixParserBase.parse(data);
    }

    public send(message: Message) {
        this.clientHandler!.send(message);
    }
    public isConnected(){
        if(this.clientHandler === null){
            return false;
        }
        return this.clientHandler!.isConnected();
    }
    public disconnect(){
        this.clientHandler!.close();
    }
}

export { Field };
export { Fields };
export { Message };
export { Messages };
export { Side };
export { OrderTypes };
export { HandlInst };
export { TimeInForce };
export { EncryptMethod };

/**
 * Export global to the window object.
 */
(global as any).FIXParser = FIXParser;
