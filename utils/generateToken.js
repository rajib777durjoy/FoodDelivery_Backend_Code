import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const generateToken = async (user) => {
    const token = jwt.sign(user,process.env.JWT_SECRET_KEY, { expiresIn: '7d' });
    return token;
}