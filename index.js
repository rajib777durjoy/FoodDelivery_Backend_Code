
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import ImageKit from "imagekit";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors({
    origin: "http://localhost:5173", // frontend URL
    credentials: true, // allow cookies
}));
app.use(cookieParser());
app.use(express.json());
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// Authentication endpoint for ImageKit upload
app.get("/auth", (req, res) => {
    const authParams = imagekit.getAuthenticationParameters();
    res.send(authParams);
});



app.listen(PORT, () => console.log("Server running on port 5000"));