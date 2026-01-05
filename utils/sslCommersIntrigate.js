
import SSLCommerzPayment from 'sslcommerz-lts';
import express from "express";
import dotenv from "dotenv";
import { TokenVerify } from '../middleware/tokenVerifyMiddleware.js';
import { db } from '../config/db.js';
import { users_table } from '../models/userModel.js';
import { eq, or } from 'drizzle-orm';
import { food_menu_table, order_table } from '../models/restaurantModel.js';
dotenv.config();
const app = express();
const store_id = process.env.SSLCOMMERZ_STORE_ID;
const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD;
const is_live = false;

const paymentIntrigate = express.Router();

paymentIntrigate.post('/init', TokenVerify, async (req, res) => {
    try {

        const { food_id: id, paymentMethod, name, phone, address, food_name, quantity } = req.body;
        const food_id = parseInt(id)

        // Check food
        const food_info = await db.select().from(food_menu_table).where(eq(food_menu_table.id, food_id));
        if (food_info.length === 0) return res.status(404).send({ message: 'Food item not found!' });

        const price = food_info[0].price;
        const delivery_charge = 50;
        const total = (price * quantity) + delivery_charge;

        const amount = paymentMethod === 'cod' ? delivery_charge : (price * quantity) + delivery_charge;
        const dueAmount = paymentMethod === 'cod' ? (total - delivery_charge) : 0;
        // Customer info
        const user = await db.select().from(users_table).where(eq(users_table.email, req?.email));
        const customer = user[0];

        // Transaction ID
        const tran_id = "TXN_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

        // Payment data
        const data = {
            total_amount: amount,
            currency: "BDT",
            tran_id: tran_id,
            success_url: `${process.env.BACKEND_URL}/api/payment/payment/success/${tran_id}`,
            fail_url: `${process.env.BACKEND_URL}/api/payment/payment/fail/${tran_id}`,
            cancel_url: `${process.env.BACKEND_URL}/api/payment/payment/cancel/${tran_id}`,
            ipn_url: `${process.env.BACKEND_URL}/api/payment/ipn/${tran_id}`,
            shipping_method: 'Courier',
            product_name: food_name,
            product_category: 'Food',
            product_profile: 'general',
            cus_name: name,
            cus_email: customer?.email,
            cus_add1: address,
            cus_add2: 'Dhaka',
            cus_city: 'Dhaka',
            cus_state: 'Dhaka',
            cus_postcode: '1000',
            cus_country: 'Bangladesh',
            cus_phone: phone,
            cus_fax: '01711111111',
            ship_name: name,
            ship_add1: 'Dhaka',
            ship_add2: 'Dhaka',
            ship_city: 'Dhaka',
            ship_state: 'Dhaka',
            ship_postcode: 1000,
            ship_country: 'Bangladesh',
        };

        // Init SSLCommerz
        const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
        const apiResponse = await sslcz.init(data);
        console.log(apiResponse.GatewayPageURL)

        if (!apiResponse.GatewayPageURL) {
            return res.status(500).send({ message: 'Gateway page URL not found', apiResponse });
        }
        res.status(200).send({ url: apiResponse.GatewayPageURL });
        // Store order
        const storeData = await db.insert(order_table).values({
            user_id: customer?.id,
            food_id: food_id,
            delivery_location: address,
            customer_phone: phone,
            quantity: quantity,
            payment_tran_id: tran_id,
            payment_method: paymentMethod,
            dueAmount: dueAmount,
            payment: amount
        }).returning();

        if (storeData.length === 0) return res.status(500).send({ message: 'Failed to create order' });



    } catch (err) {
        console.error('Payment init error:', err);
        res.status(500).send({ error: "Payment Initialization Failed" });
    }

});

paymentIntrigate.post('/payment/success/:tran_id', async (req, res) => {
    const tran_id = req.params?.tran_id;
    console.log('tranId:', tran_id)
    const updateOrder = await db.update(order_table).set({ payment_status: true }).where(eq(order_table.payment_tran_id, tran_id)).returning()
    if (updateOrder.length > 0) {
        res.redirect(`${process.env.FRONTEND_URL}/payment/success/${tran_id}`)
    }
})

paymentIntrigate.get('/paymentInformation/:tran_id', async (req, res) => {
    const tran_id = req.params?.tran_id;
    const paymentInfo = await db.select().from(order_table).where(eq(order_table.payment_tran_id, tran_id));
    if (paymentInfo.length === 0) {
        return res.redirect(`${process.env.FRONTEND_URL}`)
    }
    res.status(200).send(paymentInfo[0])
})

paymentIntrigate.post('/payment/cancel/:tran_id', async (req, res) => {
    const tran_id = req.params?.tran_id;
    const orderDelete = await db.delete(order_table).where(eq(order_table.payment_tran_id, tran_id)).returning();
    res.redirect(`${process.env.FRONTEND_URL}`)

})

paymentIntrigate.post('/payment/fail/:tran_id', async (req, res) => {
    const tran_id = req.params?.tran_id;
    console.log('payment fail::',tran_id)
    const orderDelete = await db.delete(order_table).where(eq(order_table.payment_tran_id, tran_id)).returning();
    if (orderDelete.length > 0) {
        res.redirect(`${process.env.FRONTEND_URL}/payment/fail/${tran_id}`)
    }
})





export default paymentIntrigate;
