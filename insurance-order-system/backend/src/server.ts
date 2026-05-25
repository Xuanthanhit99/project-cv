import dotenv from 'dotenv';
import http from 'http';
import express from 'express';
import app from './app'
import {Server} from 'socket.io'
import dbConnect from './config/db';
import { connectRedis } from './config/redis';

dotenv.config();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
  })
})

const startServer = async () => {
  await dbConnect();
  await connectRedis();

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  })
}

startServer();