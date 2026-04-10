
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { generateToken } from "./utils/generateToken.js";
import { restaurantRouter } from "./controllers/restaurantController.js";
import { DeliveryHeroRouter } from "./controllers/DeliveryController.js";
import http from 'http';
import { socket } from "./controllers/Socket.js";
import paymentIntrigate from "./utils/sslCommersIntrigate.js";
import { sql } from './config/db.js';
import { userRouter } from "./controllers/userController.js";

dotenv.config();

const app = express();
const server = http.createServer(app)
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: ['https://fooddelivery-704m.onrender.com','http://localhost:5173'],
    credentials: true,
    methods:['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(cookieParser());
app.use(express.json());
app.use('/api/user', userRouter);
app.use('/api/restaurant', restaurantRouter);
app.use('/api/deliveryHero', DeliveryHeroRouter);
app.use('/api/payment', paymentIntrigate)


// app.get('/user',async(req,res)=>{
//     console.log(req.params?.name)
//     res.send('hello world')
// })

app.get('/', (req, res) => {
    res.send('server is runing !!')
    console.log('server is runing !!')
})
app.post('/jwt_generate', async (req, res) => {
    const data = req.body;
    const token = await generateToken(data);
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    }).send({ message: 'token generate successfull' });
})

app.post('/jwt_remove', async (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    }).send({ message: 'cookie remove successfull' });

})

server.listen(PORT, () => {
    socket(server)
    console.log("Server running on port 5000")
});
