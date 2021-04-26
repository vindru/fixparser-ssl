/*
 * fixparser
 * https://gitlab.com/logotype/fixparser.git
 *
 * Copyright 2021 Victor Norgren
 * Released under the MIT license
 */
import { Socket } from 'net';

import { EventEmitter } from 'events';
import FIXParser from '../FIXParser';
import Message from '../message/Message';
import FIXParserClientBase from './FIXParserClientBase';
import tls, { TLSSocket } from 'tls';
import fs from 'fs';

export default class FIXParserClientSocket extends FIXParserClientBase {
    private connected: boolean = false;
    private socket: any;
    constructor(eventEmitter: EventEmitter, parser: FIXParser) {
        super(eventEmitter, parser);
    }

    public connect() {
        const options = {
            // Necessary only if using the client certificate authentication
            key: fs.readFileSync('etf_key.pem'),
            cert: fs.readFileSync('etf_con_utr8.pem'),
            rejectUnauthorized: false,
        };

        this.socket = tls.connect(443, '43.251.241.22', options, () => {
            this.connected = true;
            this.eventEmitter!.emit('open');
            this.startHeartbeat();
            console.log('client connected',
                this.socket.authorized ? 'authorized' : 'unauthorized');
            process.stdin.pipe(this.socket);
            process.stdin.resume();

            this.socket!.setEncoding('utf8');
            this.socket!.once('data', (data: any) => {
                console.log('Parser received: ',data);
                this.eventEmitter!.emit('message', data);
            });
        });

        this.socket!.once('error', (error: any) => {
            console.log('Parser error: ',this.socket);
            this.connected = false;
            this.eventEmitter!.emit('error', error);
            this.stopHeartbeat();
        });

        this.socket!.once('close', () => {
            this.connected = false;
            this.eventEmitter!.emit('close');
            this.stopHeartbeat();
        });

        this.socket!.once('timeout', () => {
            this.connected = false;
            this.eventEmitter!.emit('timeout');
            this.socket!.end();
            this.stopHeartbeat();
        });
    }

    public close() {
        if (this.socket) {
            this.socket!.removeAllListeners('message');
            this.socket!.removeAllListeners('end');
            this.socket!.removeAllListeners('');
            this.socket!.destroy();
        } else {
            console.error(
                'FIXParserClientSocket: could not close socket, connection not open',
            );
        }
    }

    public send(message: Message) {
        if (this.connected) {
            this.fixParser!.setNextTargetMsgSeqNum(
                this.fixParser!.getNextTargetMsgSeqNum() + 1,
            );
            this.socket!.write(message.encode());
        } else {
            console.error(
                'FIXParserClientSocket: could not send message, socket not open'
            );
        }
    }
    public isConnected(){
        return this.connected;
    }
}
