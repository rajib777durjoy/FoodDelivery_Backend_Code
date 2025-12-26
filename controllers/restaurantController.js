import express from "express";
import upload from "../middleware/multer.js";
import { ImageUpload } from "../middleware/cloudinaryImage.js";
import { db } from "../config/db.js";
import { restaurant_table } from "../models/restaurantModel.js";
import { eq } from "drizzle-orm";
import { users_table } from "../models/userModel.js";

export const restaurantRouter = express.Router();

restaurantRouter.post('/restaurant_partner', upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "cover", maxCount: 1 },
]), async (req, res) => {
    const data = req.body;
    const checkRestaurant = await db.select().from(restaurant_table).where(eq(restaurant_table.user_id, Number(data?.user_id)))
    // check restaurant account //
    if (checkRestaurant.length > 0) {
        // if restaurant account is available then return message //
        return res.status(200).send({ message: "already have a account !" })
    }
    const logoImg = req.files.logo[0];
    const coverImg = req.files.cover[0];
    const restaurantLogo = await ImageUpload(logoImg);
    const restaurantCover = await ImageUpload(coverImg);

    if (!restaurantLogo && !restaurantCover) {
        return res.status(500).send({ message: 'Network Problem' })
    }

    const formData = { ...data, logo: restaurantLogo, cover: restaurantCover };

    // new restaurant table create //
    const createRestaurant = await db.insert(restaurant_table).values(formData).returning();
   
    // console.log('createrestaurant successfull::', createRestaurant);

    if (!createRestaurant) {
        // restaurant table create unsuccessfull then return this message //
        return res.status(500).send({ message: 'server error' })
    };
    // user role update from users_table //
     const userRoleUpdate = await db.update(users_table).set({role:'partner'}).where(eq(users_table.id,Number(data?.user_id)));

    // if restaurant table create successfull then return this message //
    res.status(200).send({ message: 'restaurant create successfull' })
}
)