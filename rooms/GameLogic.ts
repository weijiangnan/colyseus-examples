import { GameRoom } from "./GameRoom";
import { Room, Client } from "colyseus";

export class GameLogic {
    public room: GameRoom = null;
    public clients: Client[] = [];
    bind(room: GameRoom) {
        this.room = room;
    }

    // When client successfully join the room
    onJoin(client: Client) {
        this.clients.push(client);
        if (this.clients.length == 2) {
            this.downGameInfo(client);    
        }
    }

    // When a client leaves the room
    onLeave(client: Client, consented: boolean) {
        this.clients.splice(this.clients.indexOf(client), 1)
    }

    onReceiveMessage(client: Client, msgType: string, data: any) {
        switch (msgType) {
            case "up.game.init":
                this.onGameInit(client, msgType, data);
                return true;
        }

        return false;
    }

    onGameInit(client: Client, msgType: string, data: any) {
        this.sendMessage(client, "down.game.start", { status: 1 });
        this.sendMessage(client, "down.frame.start", { round: 1 });
    }

    downGameInfo(client: Client) {
        for (let i = 0, len = this.clients.length; i < len; i++) {
            let gameInfo = { myUid: this.clients[i].sessionId, rdSeed: 9999,
                userList: [{uid: this.clients[0].sessionId, name: "选手1", avatar: "https://img.momocdn.com/album/43/E8/43E8316B-58A1-DA39-B384-9CD6091C61B220191025_S.jpg"},
                {uid: this.clients[1].sessionId, name: "选手2", avatar: "https://img.momocdn.com/album/43/E8/43E8316B-58A1-DA39-B384-9CD6091C61B220191025_S.jpg"}]
             };

            this.sendMessage(this.clients[i], "down.game.info", gameInfo);
        }

        this.room.startFrames();
    }

    sendMessage(client: Client, msgType: string, message: any) {
        this.room.sendMessage(client, msgType, message);
    }

    broadMessage(msgType: string, message: any) {
        this.broadMessage(msgType, message);
    }
}
