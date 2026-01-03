
import SSLCommerzPayment from 'sslcommerz-lts';
import express from "express";
import dotenv from "dotenv";
import { TokenVerify } from '../middleware/tokenVerifyMiddleware.js';
import { db } from '../config/db.js';
import { users_table } from '../models/userModel.js';
import { eq } from 'drizzle-orm';
dotenv.config();
const store_id = process.env.SSLCOMMERZ_STORE_ID;
const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD;
const is_live = false;

const paymentIntrigate = express.Router();

paymentIntrigate.get('/init', TokenVerify, async (req, res) => {
    const {food_id,food_name,amount}= req.body;
  const user = await db.select().from(users_table).where(eq(users_table.email,req?.email));
  const customer = user[0];
    const data = {
        total_amount: amount,
        currency: "BDT",
        tran_id: "TXN_" +Math.floor(Math.random() * 10000)+ Date.now(),
        success_url: `${process.env.FRONTEND_URL}/api/payment/success`,
        fail_url: `${process.env.FRONTEND_URL}/api/payment/fail`,
        cancel_url: `${process.env.FRONTEND_URL}/api/payment/cancel`,
        product_name: food_name,
        product_id:food_id,
        cus_name: customer.fullname,
        cus_email: customer.email,
    };
    try {
        const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
        const apiResponse = await sslcz.init(data);
        const GatewayPageURL = apiResponse.GatewayPageURL;

        res.status(200).send({ url: GatewayPageURL });
    } catch (err) {
        console.log(err);
        res.status(500).send({ error: "Payment Initialization Failed" });
    }
})


export default paymentIntrigate;
