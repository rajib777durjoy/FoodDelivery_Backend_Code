import { Server } from "socket.io";
import { db } from "../config/db.js";
import { users_table } from "../models/userModel.js";
import { eq } from "drizzle-orm";
import { delivery_table } from "../models/deliveryModel.js";
import { order_table } from '../models/restaurantModel.js'
import dotenv from "dotenv";
dotenv.config();
let io;
let location = {}
export const socket = (server) => {
    io = new Server(server, {
        cors: {
            origin:[process.env.FRONTEND_URL],
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", async (socket) => {
        console.log("User connected:", socket.id);

        // store socket id
        socket.on("currentuser", async ({ email }) => {
            try {
                await db
                    .update(users_table)
                    .set({ socket_id: socket.id })
                    .where(eq(users_table.email, email));
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
                const user_socket = await db.select().from(users_table).where(eq(users_table.id, data.user_id));
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
            await db
                .update(users_table)
                .set({ socket_id: "" })
                .where(eq(users_table.socket_id, socket.id));
        });
    });

    return io;
};


export const getIO = () => {
    if (!io) throw new Error("Socket.io not initialized!");
    return io;
}
