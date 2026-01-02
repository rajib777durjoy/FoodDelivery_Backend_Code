
import express from 'express'
import { db } from '../config/db.js';
import { users_table } from '../models/userModel.js';
import { eq } from 'drizzle-orm';
import { TokenVerify } from '../middleware/tokenVerifyMiddleware.js';

export const userRouter = express.Router();
userRouter.post('/user_data', async (req, res) => {
    const data = req.body;
    const check_user = await db.select().from(users_table).where(eq(users_table.email, data.email));
    if (check_user.length > 0) {
        return res.status(200).send({ message: 'you already user' })
    }
    const user_data_save = await db.insert(users_table).values(data).returning();
    if (!user_data_save) {
        return res.status(500).send({ message: 'user data not save ' })
    }
    console.log('user db:', user_data_save);
    res.status(200).send({ message: true })

})

userRouter.get('/user_data', TokenVerify, async (req, res) => {
    const email = req.email;
    // console.log('email::',email)
    const user = await db.select().from(users_table).where(eq(users_table.email,email));
    // console.log('get user ::',user)
    if (user.length === 0) {
        return res.status(500).send({ message: 'user is not match' })
    }
    res.status(200).send(user[0])
})
