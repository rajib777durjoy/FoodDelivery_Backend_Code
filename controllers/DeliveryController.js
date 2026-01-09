import express from 'express';
import { db } from '../config/db.js';
import { delivery_table } from '../models/deliveryModel.js';
import { TokenVerify } from '../middleware/tokenVerifyMiddleware.js';
import { users_table } from '../models/userModel.js';
import { eq } from 'drizzle-orm';
import { order_table } from '../models/restaurantModel.js';
import { getIO } from './Socket.js';
import notification_table from '../models/NotificationModal.js';

export const DeliveryHeroRouter = express.Router();

DeliveryHeroRouter.post('/create_deliver_hero_profile/:email', TokenVerify, async (req, res) => {
    const { email } = req.params; // current user email //
    if (email !== req?.email) {
        return res.status(403).send({
            message: 'You are not allowed to perform this action'
        });
    }
    const data = req.body;  // delivery form data //


    // check delivery profile //
    const check_profile = await db.select().from(delivery_table).where(eq(delivery_table.email, email));
    if (check_profile.length > 0) {
        return res.status(200).send({ message: 'Delivery profile already exists' })
    };

    // create delivery profile //
    const create_profile = await db.insert(delivery_table).values(data).returning();
    if (create_profile.length === 0) {
        return res.status(400).send({ message: "Failed to create delivery hero profile" })
    }
    const update_user_role = await db
        .update(users_table)
        .set({ role: 'deliver_hero' })
        .where(eq(users_table.id, data?.user_id))
        .returning();

    if (update_user_role.length === 0) {
        return res.status(400).send({ message: "Failed to update user role ! " })
    }
    res.status(201).send({
        message: 'Profile created successfully'
    });
})
DeliveryHeroRouter.get('/deliver_man/:email', TokenVerify, async (req, res) => {
    const { email } = req.params;
    if (email !== req.email) {
        return res.status(401).send({ message: 'Unauthorized user access ' })
    }
    const deliver_man = await db.select().from(users_table).where(eq(users_table.role, 'deliver_hero'));
    
    
    const user_Join_deliverHero = await db
        .select({
            user_id: users_table.id,
            fullname: users_table.fullname,
            email: users_table.email,
            profile: users_table.profile,
            deliverHero_id: delivery_table.id,
            socket: users_table.socket_id,
            phone: delivery_table.phone,
            location: delivery_table.location,
            ride: delivery_table.ride,
            description: delivery_table.description,
            status: delivery_table.status,
        })
        .from(users_table)
        .fullJoin(delivery_table, eq(users_table.id, delivery_table.user_id))
        .where(eq(users_table.role, 'deliver_hero')); // filter by role

    console.log(user_Join_deliverHero);

    res.status(200).send(user_Join_deliverHero);
})

// update delivery status and set deliver_id in order_table //
DeliveryHeroRouter.patch('/deliver_man/update/:id', async (req, res) => {
    const id = parseInt(req.params?.id);
    const { order_id } = req.body;
    console.log('order_id', typeof order_id)
    // update deliver-table status //
    const updateDeliverStatus = await db.update(delivery_table).set({ status: false }).where(eq(delivery_table.id, id)).returning();
    if (updateDeliverStatus.length === 0) {
        return res.status(400).send({ message: 'Delivery_table Update Failed' })
    }
    const Add_DeliverId_IN_Order_table = await db.update(order_table).set({ delivery_id: id,status:'on_the_way' }).where(eq(order_table.id, parseInt(order_id))).returning();
    if (Add_DeliverId_IN_Order_table.length === 0) {
        return res.status(400).send({ message: 'Order_table delivery_id Set Failed' })
    }
    const Deliver_user = await db.select().from(users_table).where(eq(users_table.id, updateDeliverStatus[0].user_id));

    const socket_id = Deliver_user[0].socket_id;
    const messageData = {
        user_id: Deliver_user[0].id,
        order_id: order_id,
        message: `New order assigned: #${order_id}`,
        read: false
    };
    await db.insert(notification_table).values(messageData);
    console.log('socket_id', socket_id)
    const io = await getIO();
    io.to(socket_id).emit('order-assigned', { message: `New order assigned: #${order_id}` });

    res.status(200).send({ message: 'Update Successfull !' })

})



