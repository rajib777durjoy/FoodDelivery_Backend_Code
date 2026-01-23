
import express from 'express'
import { db } from '../config/db.js';
import { users_table } from '../models/userModel.js';
import { eq } from 'drizzle-orm';
import { TokenVerify } from '../middleware/tokenVerifyMiddleware.js';
import notification_table from '../models/NotificationModal.js';
import { order_table } from '../models/restaurantModel.js';

export const userRouter = express.Router();

userRouter.get('/check_db',async(req,res)=>{
  const data= db.select().from(users_table).where(eq(users_table.email,'durjoy2001chando@gmail.com'));
  console.log('check user data::',data)
  res.send({message:'hello world !!'})
})
userRouter.post('/user_data', async (req, res) => {
  const data = req.body;
  console.log('user data:', data);

  try {
    // Validate email exists
    if (!data?.email) {
      return res.status(400).send({ message: 'Email is required' });
    }

    // Check if user already exists
    const check_user = await db
      .select()
      .from(users_table)
      .where(eq(users_table.email, data?.email));

    if (check_user.length > 0) {
      return res.status(200).send({ message: 'You are already a user'});
    }

    // Insert new user safely
    const user_data_save = await db
      .insert(users_table)
      .values({
        fullname: data?.fullname || '',
        email: data.email,
        profile: data?.profile || '',
      })
      .returning({
        id: users_table.id,
        fullname: users_table.fullname,
        email: users_table.email,
        profile: users_table.profile,
        role: users_table.role,
        socket_id: users_table.socket_id,
        createdAt: users_table.createdAt
      });

    console.log('user data saved:', user_data_save[0]);

    res.status(200).send({ message: true});

  } catch (err) {
    console.log('user_data error:', err);
    res.status(500).send({ message: 'Internal server error', error: err.message });
  }
});

userRouter.get('/user_data', async (req, res) => {
    const email = req.email;
    console.log('email::', email)
    const user = await db.select().from(users_table).where(eq(users_table.email, email));
    console.log('get user ::', user)
    if (user.length === 0) {
        return res.status(500).send({ message: 'user is not match' })
    }
    res.status(200).send(user[0])
})

userRouter.get('/deliver_man/:email', TokenVerify, async (req, res) => {
    const { email } = req.params;
    if (email !== req.email) {
        return res.status(401).send({ message: 'Unauthorized user access ' })
    }
    const deliver_man = await db.select().from(users_table).where(eq(users_table.role, 'deliver_hero'));

    res.status(200).send(deliver_man);
})

userRouter.get('/notifications/:user_id', async (req, res) => {
    const id = parseInt(req.params.user_id);
    const notification = await db.select().from(notification_table).where(eq(notification_table.user_id, id));
    if (notification.length === 0) {
        return res.status(400).send({ message: 'notification is not found !' })
    }
    res.status(200).send(notification);
})

/// find the order details for notification page  ///
userRouter.get('/notifications/order_details/:id', async (req, res) => {
    const id = parseInt(req.params?.id);
    const details = await db.select().from(order_table).where(eq(order_table.id, id));
    if (details.length === 0) {
        return res.status(400).send({ message: 'order details is not found !' })
    }
    res.status(200).send(details[0]);
})
