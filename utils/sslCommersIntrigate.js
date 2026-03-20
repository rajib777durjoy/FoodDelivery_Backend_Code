
import SSLCommerzPayment from 'sslcommerz-lts';
import express from "express";
import dotenv from "dotenv";
import { TokenVerify } from '../middleware/tokenVerifyMiddleware.js';
import sendEmail from './nodemiller.js';
import { sql } from '../config/db.js';
dotenv.config();


const store_id = process.env.SSLCOMMERZ_STORE_ID;
const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD;
const is_live = false;

const paymentIntrigate = express.Router();

paymentIntrigate.post('/init', TokenVerify, async (req, res) => {
    try {

        const { food_id: id, paymentMethod, name, phone, address, food_name, quantity } = req.body;
        const food_id = parseInt(id)

        // Check food
           const food_info = await sql`select * from food_menu_table where id = ${food_id} ;` ;
        if (food_info.length === 0) return res.status(404).send({ message: 'Food item not found!' });
        const res_id = food_info[0].res_id;
           const Owner_Info = await sql`select * from restaurant_table where id=${res_id} ;` ;
        const owner_id = Owner_Info[0].user_id;
        const price = food_info[0].price;
        const delivery_charge = 50;
        const total = (price * quantity) + delivery_charge;

        const amount = paymentMethod === 'cod' ? delivery_charge : (price * quantity) + delivery_charge;
        const dueAmount = paymentMethod === 'cod' ? (total - delivery_charge) : 0;
//         // Customer info
           const user = await sql`select * from users_table where email = ${req?.email} ;` ;
        const customer = user[0];

//         // Transaction ID
        const tran_id = "TXN_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

//         // Payment data
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

//         // Init SSLCommerz
        const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
        const apiResponse = await sslcz.init(data);
        console.log(apiResponse.GatewayPageURL)

        if (!apiResponse.GatewayPageURL) {
            return res.status(500).send({ message: 'Gateway page URL not found', apiResponse });
        }
        res.status(200).send({ url: apiResponse.GatewayPageURL });
//         // Store order
         const storeData = await sql`INSERT INTO order_table (owner_id,cus_id,food_id,delivery_location,customer_phone,quantity,payment_tran_id,payment_method,dueAmount,payment)
          values (${owner_id},${customer?.id},${food_id},${address},${phone},${quantity},${tran_id},${paymentMethod},${dueAmount},${amount}) RETURNING * ` ;

        if (storeData.length === 0) return res.status(500).send({ message: 'Failed to create order' });

    } catch (err) {
        console.error('Payment init error:', err);
        res.status(500).send({ error: "Payment Initialization Failed" });
    }

});
// due payment init  
paymentIntrigate.post('/duepayment_init', TokenVerify, async (req, res) => {
    try {
        const { order_id } = req.body;

         const order_info = await sql`select * from order_table where id = ${parseInt(order_id)} ;` ;
        const { owner_id, dueAmount, cus_id, customer_phone, food_id, delivery_id, delivery_location, payment_tran_id } = order_info[0];

          const userInfo = await sql`select * from users_table where id = ${cus_id} ;` ;
           const foodInfo = await sql`select * from food_menu_table where id = ${food_id} ;` ;
           const deliveryInfo = await sql`select * from delivery_table where id = ${delivery_id} ;` ;



        const { fullname, email } = userInfo[0];
        const { food_name } = foodInfo[0];
        // Transaction ID
        // const tran_id = "TXN_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

        // Payment data
        const data = {
            total_amount: dueAmount,
            currency: "BDT",
            tran_id: payment_tran_id,
            success_url: `${process.env.BACKEND_URL}/api/payment/payment/success/dueamount/${payment_tran_id}`,
            fail_url: `${process.env.BACKEND_URL}/api/payment/payment/fail/dueamount/${payment_tran_id}`,
            cancel_url: `${process.env.BACKEND_URL}/api/payment/payment/cancel/dueamount/${payment_tran_id}`,
            ipn_url: `${process.env.BACKEND_URL}/api/payment/ipn/${payment_tran_id}`,
            shipping_method: 'Courier',
            product_name: food_name,
            product_category: 'Food',
            product_profile: 'general',
            cus_name: fullname,
            cus_email: email,
            cus_add1: delivery_location,
            cus_add2: 'Dhaka',
            cus_city: 'Dhaka',
            cus_state: 'Dhaka',
            cus_postcode: '1000',
            cus_country: 'Bangladesh',
            cus_phone: customer_phone,
            cus_fax: '01711111111',
            ship_name: fullname,
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


    } catch (err) {
        console.error('Payment init error:', err);
        res.status(500).send({ error: "Payment Initialization Failed" });
    }

});

paymentIntrigate.post('/payment/success/:tran_id', async (req, res) => {
    const tran_id = req.params?.tran_id;
    console.log('tranId:', tran_id)
   const updateOrder = await sql`UPDATE order_table SET payment_status = ${true} where payment_tran_id = ${tran_id} RETURNING * ;`;
    if (updateOrder.length > 0) {
        res.redirect(`${process.env.FRONTEND_URL}/payment/success/${tran_id}`)
    }
})

// // success payment for due amount //
paymentIntrigate.post('/payment/success/dueamount/:tran_id', async (req, res) => {
    const tran_id = req.params?.tran_id;
    const OTP = Math.floor(1000 + Math.random() * 9000);
       const order_info = await sql`select * from order_table where payment_tran_id = ${tran_id} ;` ;
    if (order_info.length === 0) {
        return res.status(400).send({ message: 'Transaction ID mismatch' })
    }
    const { delivery_id, cus_id } = order_info[0];

       const userInfo = await sql`select * from users_table where id = ${cus_id} ;` ;

       const deliverHero_info = await sql`select * from delivery_table where id = ${delivery_id} ;` ;
    if (deliverHero_info.length === 0 && userInfo.length === 0) {
        return res.status(400).send({ message: 'delivery and user data is not found !' })
    }
    const { email:deliverman_email } = deliverHero_info[0];
    const { email:cus_email } = userInfo[0];
    console.log('tranId:', tran_id)
       const updateOrder = await sql`UPDATE order_table SET dueAmount = ${0.00} , OTP: OTP  where payment_tran_id = ${tran_id} RETURNING * ;`; 
    if (updateOrder.length > 0) {
        // here is nodemiler function for send OTP in email //
        const subject='Your OTP Code'
        const deliver_sub='Your Customer OTP Code';
        const html =`<h1>Your OTP is: ${OTP} <br>  Tranx_id:${tran_id}</h1>`;
        await sendEmail({to:cus_email,subject,html}) /// send email to customer  //
        await sendEmail({to:deliverman_email,subject:deliver_sub,html}) /// send email to delivery man //
        return res.redirect(`${process.env.FRONTEND_URL}/payment/success/${tran_id}`)
    }
})

paymentIntrigate.get('/paymentInformation/:tran_id', async (req, res) => {
    const tran_id = req.params?.tran_id;
       const paymentInfo = await sql`select * from order_table where payment_tran_id = ${tran_id} ;` ;
    if (paymentInfo.length === 0) {
        return res.redirect(`${process.env.FRONTEND_URL}`)
    }
    res.status(200).send(paymentInfo[0])
})

paymentIntrigate.post('/payment/cancel/:tran_id', async (req, res) => {
    const tran_id = req.params?.tran_id;
    const orderDelete = await sql`DELETE order_table where payment_tran_id = ${tran_id} RETURNING * ;`; 
    if (orderDelete.length > 0) {
        return res.redirect(`${process.env.FRONTEND_URL}`)
    }


})
// payment cancel for due amount //
paymentIntrigate.post('/payment/cancel/dueamount/:tran_id', async (req, res) => {
    const tran_id = req.params?.tran_id;
    res.redirect(`${process.env.FRONTEND_URL}`)

})

paymentIntrigate.post('/payment/fail/:tran_id', async (req, res) => {
    const tran_id = req.params?.tran_id;
    console.log('payment fail::', tran_id)
   const orderDelete = await sql`DELETE order_table where payment_tran_id = ${tran_id} RETURNING * ;`; 
    if (orderDelete.length > 0) {
        return res.redirect(`${process.env.FRONTEND_URL}/payment/fail/${tran_id}`)
    }
})

// payment fail for due amount //
paymentIntrigate.post('/payment/fail/dueamount/:tran_id', async (req, res) => {
    const tran_id = req.params?.tran_id;
    res.redirect(`${process.env.FRONTEND_URL}/payment/fail/${tran_id}`)

})

export default paymentIntrigate;
