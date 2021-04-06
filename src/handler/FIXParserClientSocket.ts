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
        });
        this.socket.setEncoding('utf8');
        this.socket.on('data', (data: any) => {
            this.eventEmitter!.emit('message', data);
        });

        this.socket.on('error', (error: any) => {
            this.connected = false;
            this.eventEmitter!.emit('error', error);
            this.stopHeartbeat();
        });

        this.socket.on('close', () => {
            this.connected = false;
            this.eventEmitter!.emit('close');
            this.stopHeartbeat();
        });

        this.socket.on('timeout', () => {
            this.connected = false;
            this.eventEmitter!.emit('timeout');
            this.socketTCP!.end();
            this.stopHeartbeat();
        });

        // this.socketTCP = new Socket();
        // this.socketTCP!.setEncoding('ascii');
        // this.socketTCP!.pipe(new FrameDecoder()).on('data', (data: any) => {
        //     const messages: Message[] = this.fixParser!.parse(data.toString());
        //     let i = 0;
        //     for (i; i < messages.length; i++) {
        //         this.processMessage(messages[i]);
        //         this.eventEmitter!.emit('message', messages[i]);
        //     }
        // });

        // this.socketTCP!.on('close', () => {
        //     this.connected = false;
        //     this.eventEmitter!.emit('close');
        //     this.stopHeartbeat();
        // });

        // this.socketTCP!.on('error', (error) => {
        //     this.connected = false;
        //     this.eventEmitter!.emit('error', error);
        //     this.stopHeartbeat();
        // });

        // this.socketTCP!.on('timeout', () => {
        //     this.connected = false;
        //     this.eventEmitter!.emit('timeout');
        //     this.socketTCP!.end();
        //     this.stopHeartbeat();
        // });

        // this.socketTCP!.connect(this.port!, this.host!, () => {
        //     this.connected = true;
        //     console.log('Connected');
        //     this.eventEmitter!.emit('open');
        //     this.startHeartbeat();
        // });
    }

    public close() {
        if (this.socketTCP) {
            this.socketTCP!.destroy();
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
            this.socket.write(message.encode());
        } else {
            console.error(
                'FIXParserClientSocket: could not send message, socket not open',
                message,
            );
        }
    }
}
