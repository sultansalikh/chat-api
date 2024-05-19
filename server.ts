import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { logger } from './logger';
import MySqlDB from './database';

const db = new MySqlDB();

const app = express();
const httpServer = createServer(app);
const socketServer = new SocketIOServer( httpServer/* , { cors: {
    origin: [`http://127.0.0.1:5173`,`http://localhost:5173`],
  } 
} */);
const io = socketServer.sockets;

const port = 3050;

// app.get("/", (req, res) => {
//     res.sendFile(__dirname + "/index.html");
// });

socketServer.on("connection", (socket) => {
    logger.info(`A user with ID: ${socket.id} connected.`);

    socket.on("disconnect", () => {
        logger.info(`A user with ID: ${socket.id} disconnected.`);
    });

    if (io.sockets) {
        socket.emit("connections", Object.keys(io.sockets).length);
    }

    if (!io.sockets) {
        socket.emit("connections", 0);
    }

    socket.on("chat-message", async (message) => {
        const data: {
            message: string;
            userId: number;
            firstName: string;
        } = {
          userId: Number(socket.id),
          message: message.message,
          firstName: message.userName,
        };

        await db.createUserMessage(data);
        socket.broadcast.emit("chat-message", message);
      });
    
      socket.on("typing", (data) => {
        socket.broadcast.emit("typing", data);
      });

      socket.on("stopTyping", () => {
        socket.broadcast.emit("stopTyping");
      });

      socket.on("joinedChat", async (firstName) => {
        let messageData = null;

        const data: {
            id: number;
            firstName: string;
        } = {
            id: Number(socket.id),
            firstName,
        };

        const newUser = await db.createUser(data);

        if (newUser) {
            messageData = await db.fetchMessage(data);
        }
      });

      socket.on("leaveChat", (data) => {
        socket.broadcast.emit("leaveChat", data);
      });
});


httpServer.listen(port, () => {
    logger.info(`🚀 Listening on port: ${port}.`)
});


