import express from 'express';
import { sql } from '../config/db.js';
import { TokenVerify } from '../middleware/tokenVerifyMiddleware.js';
import { getIO } from './Socket.js';
import verifyOwner from '../middleware/VerifyOwner.js';
import VerifyDeliveryMan from '../middleware/VerifyDeliveryMan.js';




export const DeliveryHeroRouter = express.Router();

DeliveryHeroRouter.post('/create_deliver_hero_profile/:email', TokenVerify, async (req, res) => {
    const { email } = req.params; // current user email //
    if (email !== req?.email) {
        return res.status(403).send({
            message: 'You are not allowed to perform this action'
        });
    }
    const data = req.body;  // delivery form data //
    console.log("delivery data::", data)

    //     // check delivery profile //

    const check_profile = await sql`select * from delivery_table where email = ${email} ;`;
    if (check_profile.length > 0) {
        return res.status(200).send({ message: 'Delivery profile already exists' })
    };

    // create delivery profile //
    const create_profile = await sql`INSERT INTO delivery_table (user_id,name,email,phone,location,ride,description) VALUES(${data?.user_id},${data?.name},${data?.email},${data?.phone},${data?.location},${data?.ride},${data?.description}) RETURNING *;`;
    if (create_profile.length === 0) {
        return res.status(400).send({ message: "Failed to create delivery hero profile" })
    }
    console.log('create profile::', create_profile)
   const update_user_role = await sql`
  UPDATE users_table
  SET role = 'deliver_hero'
  WHERE id = ${data?.user_id}
  RETURNING *;
`;
    console.log('user update role ;', update_user_role)

    if (update_user_role.length === 0) {
        return res.status(400).send({ message: "Failed to update user role ! " })
    }
    res.status(201).send({
        message: 'Profile created successfully'
    });
})

DeliveryHeroRouter.get('/deliver_man/:email', TokenVerify, verifyOwner, async (req, res) => {
    const { email } = req.params;
    if (email !== req.email) {
        return res.status(401).send({ message: 'Unauthorized user access ' })
    }
    const deliver_man = await sql`select * from users_table where role = 'deliver_hero' ;`;
    // console.log('delivery_man',deliver_man)
    const result = await sql`
SELECT 
    u.id AS user_id,
    u.fullname,
    u.email,
    u.profile,
    d.id AS deliverHero_id,
    u.socket_id AS socket,
    d.phone,
    d.location,
    d.ride,
    d.description,
    d.status
FROM users_table u
FULL JOIN delivery_table d 
    ON u.id = d.user_id
WHERE u.role = 'deliver_hero';
`; 
    console.log('delivery list::',result);

    res.status(200).send(result);
})

// update delivery status and set deliver_id in order_table //
DeliveryHeroRouter.put('/deliver_man/update/:id', TokenVerify, verifyOwner, async (req, res) => {
    const id = parseInt(req.params?.id);
    const { order_id } = req.body;
    // console.log('order_id', typeof order_id)
    // update deliver-table status //
    const updateDeliverStatus = await sql`
UPDATE delivery_table
SET status = ${false}
WHERE id = ${id}
RETURNING *;
`;
    if (updateDeliverStatus.length === 0) {
        return res.status(400).send({ message: 'Delivery_table Update Failed' })
    }
    const Add_DeliverId_IN_Order_table = await sql`
UPDATE order_table
SET 
    delivery_id = ${id},
    status = 'On_the_way'
WHERE id = ${parseInt(order_id)}
RETURNING *;
`;
// console.log('Add deliverId:',Add_DeliverId_IN_Order_table) 

    if (Add_DeliverId_IN_Order_table.length === 0) {
        return res.status(400).send({ message: 'Order_table delivery_id Set Failed' })
    }
    const Deliver_user = await sql`
SELECT *
FROM users_table
WHERE id = ${updateDeliverStatus[0].user_id};
`;
console.log('deliver_user_update:',Deliver_user);

    const socket_id = Deliver_user[0].socket_id;
    const messageData = await sql`
INSERT INTO notification_table (user_id, order_id, message, read)
VALUES (
    ${Deliver_user[0].id},
    ${order_id},
    ${`New order assigned: #${order_id}`},
    ${false}
)
RETURNING *;
`;
    // console.log('socket_id', socket_id)
    const io = await getIO();
    io.to(socket_id).emit('order-assigned', { message: `New order assigned: #${order_id}` });

    res.status(200).send({ message: 'Booking Successfull !' })

})


// // order list for find the deliver_history //
DeliveryHeroRouter.get('/order_for_delivery_list/:id/:email', TokenVerify, verifyOwner, async (req, res) => {
    const { id, email } = req.params; // id is string  //
    console.log(id, email)
    if (email !== req.email) {
        return res.status(401).send({ message: "Unauthorized user access !" })
    }

    const order_list = await sql`
SELECT 
    o.id,
    u.fullname AS customer,
    o.delivery_id AS deliverMan,
    o.payment AS amount,
    o.dueAmount AS "DueAmount",
    o.customer_phone AS cus_phone,
    o.status
FROM order_table o
INNER JOIN users_table u 
    ON u.id = o.cus_id
WHERE 
    o.owner_id = ${parseInt(id)}
    AND o.delivery_id IS NOT NULL;
`;
    //     // console.log('order list for delivery::: ',order_list)
    if (order_list.length === 0) {
        return res.status(400).send({ message: 'order is not found !' })
    }
    res.status(200).send(order_list)
})

// // delivery boy complete her deliver and change status for get money ///
DeliveryHeroRouter.patch('/change_delivery_status/:id/:email', TokenVerify, async (req, res) => {
    const id = parseInt(req.params.id);
    const { email } = req.params;
    const { status, OTP } = req.body;
    console.log(status, email, id, OTP, typeof (OTP))
    if (email !== req.email) {
        return res.status(401).send({ message: 'Unauthorize user access !' })
    }

    const deliver_man = await sql`
SELECT *
FROM delivery_table
WHERE email = ${email};
`;
    if (deliver_man.length === 0) {
        return res.status(400).send({ message: 'delivery man is not found !' });
    }
    if (verifyOrderList.length === 0) {
        return res.status(404).send({ message: "Order verify failed !" })
    }
    // send payment to delivery man account / casually, It's not for real payment //
    const payment = 50;
    const currentBalance = Number(deliver_man[0]?.balance || 0);
    const newBalance = currentBalance + payment;
    const payment_Delivery_hero = await sql`
UPDATE delivery_table
SET 
    balance = ${payment},
    status = ${true}
WHERE id = ${deliver_man[0]?.id}
RETURNING *;
`;
    if (payment_Delivery_hero.length === 0) {
        return res.status(404).send({ message: 'delivery payment failed !' })
    }
    const order_status_update = await sql`
UPDATE order_table
SET 
    status = ${status},
    OTP = NULL
WHERE 
    id = ${id}
    AND delivery_id = ${deliver_man[0]?.id}
RETURNING *;
`;
    // //     console.log('order status ::', order_status_update)
    if (order_status_update.length === 0) {
        return res.status(500).send({ message: 'status update failed !' })
    }
    res.status(200).send({ message: 'delivery Complete !' })
})

// // get total earning delivery man  //
DeliveryHeroRouter.get('/totalEarning/:id', TokenVerify, VerifyDeliveryMan, async (req, res) => {
    const id = parseInt(req.params.id);
    console.log('166 line_ id', id)
    const deliverMan = await sql`
SELECT *
FROM delivery_table
WHERE user_id = ${id};
`;
    if (deliverMan.length === 0) {
        return res.status(401).send({ message: 'delivery man is not found ' })
    }

    if (deliverMan[0].email !== req.email) {
        return res.status(401).send({ message: 'Unauthorized user access !' })
    }
    console.log(deliverMan[0])
    res.status(200).send(deliverMan[0]);
})

DeliveryHeroRouter.get('/static_page/:id', TokenVerify, VerifyDeliveryMan, async (req, res) => {
    const id = parseInt(req.params?.id);
    const deliver_list = await sql`
SELECT 
    o.id,
    o.status,
    o.delivery_location AS location,
    o.updated_at,
    o.customer_phone AS cus_phone,
    o.payment_method,
    o.OTP,
    o.payment,
    o.dueAmount AS "DueAmount",
    o.quantity,
    o.payment_tran_id AS payment_tran,
    d.balance
FROM delivery_table d
INNER JOIN order_table o
    ON d.id = o.delivery_id
WHERE d.user_id = ${id};
`;
    if (deliver_list.length === 0) {
        return res.status(400).send({ message: 'delivery list is not found !' })
    }
    res.status(200).send(deliver_list);
})



