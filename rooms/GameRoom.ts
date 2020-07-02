import { Room, Client } from "colyseus";
// import GameLogic from "./GameLogic"

import { GameLogic } from "./GameLogic";

export class GameRoom extends Room {
    seed: number = 0;

    FRAME_RATE: number = 60;
    frame_index: number = 0;
    frame_interval: any = null;
    frame_list: any[] = [[]];
    frame_acc: number = 1;

    actors: Map<string, any> = new Map();

    maxClients = 20;
    logic :GameLogic = new GameLogic();

    // When room is initialized
    // onInit(options: any) {
    //     console.log("server onInit ---- ");
    //     this.frame_index = 0;
    //     this.seed = Math.round(Math.random() * 1000000000);
    //     this.frame_interval = setInterval(this.tick.bind(this), 1000 / this.FRAME_RATE);
    //     this.frame_list = [];
    // }

    onCreate (options: any){
        console.log("server onCreate ---- ");
        this.frame_index = 0;
        this.seed = Math.round(Math.random() * 1000000000);
        
        this.logic.bind(this);
    }

    startFrames() {
        if (this.frame_interval != null) {
            clearInterval(this.frame_interval);
        }

        this.frame_index = 0;
        this.frame_interval = setInterval(this.tick.bind(this), 49);
        this.frame_list = [];
    }

    getFrameByIndex(index) {
        if (this.frame_list[index] === undefined) {
            this.frame_list[index] = [];
        }
        return this.frame_list[index];
    }

    
    tick() {
        // console.log("server tick---------------- ");
        // let frames = [];
        // frames.push([this.frame_index, this.getFrameByIndex(this.frame_index)]);
        // // console.log("server 广播 ---- ", frames);
        // this.broadcast(["f", frames]);
        let message = { fid: this.frame_index, cmds: this.getFrameByIndex(this.frame_index) };
        this.broadMessage("down.fs.frames", message);

        this.frame_index += this.frame_acc;
    }

    // Checks if a new client is allowed to join. (default: `return true`)
    requestJoin(options: any, isNew: boolean) {
        return true;
    }

    // When client successfully join the room
    onJoin(client: Client) {
        console.log("client join    ", client.sessionId);
        // this.broadcast(`${client.sessionId} joined.`);

        // this.downGameInfo(client);
        this.logic.onJoin(client);
    }

    // When a client leaves the room
    onLeave(client: Client, consented: boolean) {
        console.log("client onLeave    ", client.sessionId);
        // this.broadcast(`${client.sessionId} left.`);

        this.logic.onLeave(client, consented);
    }

    // When a client sends a message
    onMessage(client: Client, message: any) {
        if (!this.logic.onReceiveMessage(client, message[0], message[1])) {
            this.onReceiveMessage(client, message[0], message[1]);
        }
    }

    onReceiveMessage(client: Client, msgType: string, data: any) {
        console.log("---- receicve type:", msgType, ", message:", data);

        switch (msgType) {
            // case "up.game.init":
            //     this.onGameInit(client, msgType, data);
            //     break;
            case "up.fs.cmd":
                this.onCmd(client, msgType, data);
                break;
            case "up.pull.frames":
                this.onGetAllFrames(client, msgType, data);
                break;
            case "up.ping":
                this.onPing(client, msgType, data);
                break;
        }
    }

    // Cleanup callback, called after there are no more clients in the room. (see `autoDispose`)
    onDispose() {
        clearInterval(this.frame_interval);
        console.log("Dispose IOGRoom");
    }

    frame_list_push(data: any) {
        //每帧数据都塞进去
        // console.log("frame_list   push ", data);
        let index = this.frame_index;
        let frame = JSON.parse(data);
        if (frame.pdtFid != undefined && frame.pdtFid > index) {
            index = frame.pdtFid;
        }

        if (this.frame_list[index] == undefined) {
            this.frame_list[index] = [];
        }

        this.frame_list[index].push(JSON.parse(data));
    }

    onCmd(client: Client, msgType: string, data: any) {
        // 帧同步数据，保存转发
        this.frame_list_push(data);
    }

    onGetAllFrames(client: Client, msgType: string, data: any) {
        let frames = [];
        for (let i = 0, len = this.frame_list.length; i < len; i++) {
            if (this.frame_list[i] !== undefined) {
                frames.push({ fid: i, cmds: this.frame_list[i] });
            }
        }

        if (frames.length == 0) {
            frames = [ { fid: 0, cmds: [] }];
        }

        this.sendMessage(client, "down.pull.frames", frames);
    }

    onPing(client: Client, msgType: string, data: any) {
        let ping = JSON.parse(data);
        this.sendMessage(client, "down.pong", ping);
    }

    // onGameInit(client: Client, msgType: string, data: any) {
    //     this.sendMessage(client, "down.game.start", {});
    // }

    // downGameInfo(client: Client) {
    //     let gameInfo = { myUid: client.sessionId, rdSeed: 9999 }
    //     this.sendMessage(client, "down.game.info", gameInfo);
    // }

    sendMessage(client: Client, msgType: string, message: any) {
        console.log(">>>> sendTo", client.sessionId, ", type:", msgType, ", message:", message);

        this.send(client, [msgType, JSON.stringify(message)]);
    }

    broadMessage(msgType: string, message: any) {
        console.log("==== broadcast type:", msgType, ", message:", message);
        this.broadcast([msgType, JSON.stringify(message)]);
    }
}
