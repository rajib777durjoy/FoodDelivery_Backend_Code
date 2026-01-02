import { Server } from "socket.io";
import { db } from "../config/db.js";
import { users_table } from "../models/userModel.js";
import { eq } from "drizzle-orm";

let io ;
export const socket = (server) => {
   io = new Server(server, {
        cors: {
            origin: "http://localhost:5173",
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", async (socket) => {
        console.log("User connected:", socket.id);
        socket.on('currentuser', async ({ email }) => {
            // console.log('email::', email)
            try {
                const socketId = await db.update(users_table).set({ socket_id:socket.id}).where(eq(users_table.email,email)).returning();
                // console.log('socketId store:::', socketId)
            } catch (err) {
               console.log('error',err)
            }
        })

        socket.on("disconnect", async () => {
            console.log("User disconnected:", socket.id);
            const socketId = await db.update(users_table).set({ socket_id: " " }).where(eq(users_table.socket_id, socket.id)).returning();
            // console.log('socketId update::', socketId);
        });
    });
    return io ;
};

export const getIO=()=> {
 if(!io)throw new Error("Socket.io not initialized!");
 return io;
}
