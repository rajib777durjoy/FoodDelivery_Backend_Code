
import express from 'express'
import { sql } from '../config/db.js';

import { TokenVerify } from '../middleware/tokenVerifyMiddleware.js';

export const userRouter = express.Router();

userRouter.post('/user_data', async (req, res) => {
  const data = req.body;
 
  // Validate email exists
  if (!data?.email) {
    return res.status(400).send({ message: 'Email is required' });
  };


  // Check if user already exists
  const check_user = await sql`select * from users_table where email = ${data?.email}`;
  if (check_user.length > 0) {
    return res.status(201).send({ message: 'user is exist !' })
  }

  // Insert new user safely
  const fullname = data?.fullname;
  const email = data?.email;
  const profile = data?.profile;
  const user_data_save = await sql` Insert Into users_table (fullname,email,profile) 
    values (${fullname},${email},${profile}) RETURNING *`
  console.log('user save data ', user_data_save[0]);
  return res.status(200).send(user_data_save[0]);
});

userRouter.get('/user_data/:email', async (req, res) => {
  const email = req.params?.email;
  console.log(email)
  const user = await sql`select * from users_table where email = ${email}`;
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
  const deliver_man = await sql`SELECT * FROM users_table WHERE role = ${'deliver_hero'};
`;
  res.status(200).send(deliver_man);
})

userRouter.get('/notifications/:user_id', async (req, res) => {
  const id = parseInt(req.params.user_id);
const notification = await sql`SELECT * FROM notification_table WHERE user_id = ${id}`;
  if (notification.length === 0) {
    return res.status(400).send({ message: 'notification is not found !' })
  }
  res.status(200).send(notification);
})

// find the order details for notification page  ///
userRouter.get('/notifications/order_details/:id', async (req, res) => {
  const id = parseInt(req.params?.id);
 const details = await sql`SELECT * FROM order_table WHERE id = ${id}`;
  if (details.length === 0) {
    return res.status(400).send({ message: 'order details is not found !' })
  }
  res.status(200).send(details[0]);
})
