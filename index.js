
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { userRouter } from "./controllers/userController.js";
import { generateToken } from "./utils/generateToken.js";
import { restaurantRouter } from "./controllers/restaurantController.js";
import { DeliveryHeroRouter } from "./controllers/DeliveryController.js";
import http from 'http';
import { socket } from "./controllers/Socket.js";
import paymentIntrigate from "./utils/sslCommersIntrigate.js";

dotenv.config();

const app = express();
const server = http.createServer(app)
const PORT = process.env.PORT || 5000;
app.use(cors({
    origin: "http://localhost:5173", // frontend URL
    credentials: true, // allow cookies
}));






app.use(cookieParser());
app.use(express.json());
app.use('/api/user', userRouter);
app.use('/api/restaurant',restaurantRouter);
app.use('/api/deliveryHero',DeliveryHeroRouter);
app.use('/api/payment',paymentIntrigate)

app.post('/jwt_generate', async (req, res) => {
    const data = req.body;
    const token = await generateToken(data);
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    }).send({message:'token generate successfull'});
})

app.post('/jwt_remove', async (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    }).send({ message: 'cookie remove successfull' });

})

// const imagekit = new ImageKit({
//     publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
//     privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
//     urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
// });


server.listen(PORT, () => {
    socket(server)
    console.log("Server running on port 5000")});