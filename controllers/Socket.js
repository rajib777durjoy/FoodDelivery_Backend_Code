import { Server } from "socket.io";
import { sql } from "../config/db.js";
import dotenv from "dotenv";
dotenv.config();
let io;
let location = {}
export const socket = (server) => {
    io = new Server(server, {
        cors: {
            origin:['http://localhost:5173',process.env.FRONTEND_URL,],
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", async (socket) => {
        console.log("User connected:", socket.id);

        // store socket id
        socket.on("currentuser", async ({ email }) => {
            try {
                await sql`UPDATE users_table SET socket_id = ${ socket.id } WHERE email = ${ email } ;` ;
            } catch (err) {
                console.log("error:", err);
            }
        });

        // send location
        socket.on("send_location", async (data) => {
            console.log('data', data)
            try {
                // save location in memory
                location[socket.id] = {
                    lat: data.lat,
                    lng: data.lng,
                };

                console.log('kkdfd', location)
                const user_socket = await sql`SELECT * FROM users_table WHERE id = ${ data.user_id };`;
                const socket_id = user_socket[0]?.socket_id;
                console.log('socket_id:::', location[socket_id])
                // send location to delivery hero
                io.to(socket_id).emit("receive_location",(location[socket_id]));
            } catch (err) {
                console.log("send_location error:", err);
            }
        });

        // disconnect
        socket.on("disconnect", async () => {
            console.log("User disconnected:", socket.id);
            await sql`UPDATE users_table SET socket_id = '' WHERE socket_id = ${ socket.id } RETURNING *;`;
        });
    });

    return io;
};


export const getIO = () => {
    if (!io) throw new Error("Socket.io not initialized!");
    return io;
}
