const express = require("express");
const http = require("http");
const path = require("path");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());
// ارائه فایل‌های ایستا در فولدر public
app.use(express.static(path.join(__dirname, "public")));


let waitingPlayer = {socket : null , name : null} ;
let nextRoomID = 0 ;
let gameState = {};

function gameInit(roomId){
    let random = Math.floor(Math.random()*2);
    if(random==0) gameState[roomId].player1.emperor = true;
    else gameState[roomId].player2.emperor = true;
}

// Socket.IO برای بخش real-time
io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on('findOpponent' , (name) => {
        if(waitingPlayer.socket){
            let roomID = String(nextRoomID++);
            socket.join(roomID);
            waitingPlayer.socket.join(roomID);

            let dataPlayer1 = {name , score:0 , emperor: false , id: socket.id , card: null};
            let dataPlayer2  = {name : waitingPlayer.name , score:0 , emperor:false , id: waitingPlayer.socket.id , card:null};
            gameState[roomID] = {
                [socket.id] : dataPlayer1 ,
                [waitingPlayer.socket.id] : dataPlayer2,
                player1 : dataPlayer1 ,
                player2 : dataPlayer2 ,
                isSelect : false ,
                draw: false
            }

            gameInit(roomID);

            waitingPlayer = {socket : null , name : null};
            io.to(roomID).emit('ready' , {state:gameState[roomID] , room: roomID});
        }else {
            waitingPlayer.socket = socket;
            waitingPlayer.name = name
            socket.emit('waiting');
        }
    })

    socket.on('select' , (data) => {
        let room = gameState[data.room];
        room[socket.id].card = data.card;
        if(room.isSelect){
            room.isSelect = false;
            room.draw = false;
            gameLogic(room);
            io.to(data.room).emit('endRound' , room);
        }else{
            room.isSelect = true;
            socket.to(data.room).emit('selected');
        }

    })

    function gameLogic(state){
        let player1 = state.player1.card;
        let player2 = state.player2.card;

        if(player1 == 1){
           if(player2 == 1) state.draw = true;
           else if (player2 == 2) state.player1.score += 2;
           else if(player2 == 4) state.player2.score += 1;
        }
        else if(player1 == 2){
            if(player2 == 1) state.player2.score += 2 ;
            else if(player2 == 4) state.player1.score += 4;
        }else if(player1 == 4){
            if(player2 == 1) state.player1.score += 1;
            else if (player2 == 2) state.player2.score += 4;
        }

    }

    function gameOver(){

    }

    socket.on("disconnect", () => {
        const playerId = socket.data.playerId;
        if (playerId && players[playerId]) {
            // اطلاع به دیگران که بازیکن خارج شد
            socket.broadcast.emit("playerLeft", { id: playerId });
            // می‌توان حذف دائمی یا نگه داشت تا مجدداً وصل شود
            delete players[playerId];
        }
        console.log("Socket disconnected:", socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
