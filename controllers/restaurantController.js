import express from "express";
import upload from "../middleware/multer.js";
import { ImageUpload } from "../middleware/cloudinaryImage.js";
import { db } from "../config/db.js";
import { food_menu_table, restaurant_table } from "../models/restaurantModel.js";
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
    const userRoleUpdate = await db.update(users_table).set({ role: 'partner' }).where(eq(users_table.id, Number(data?.user_id)));

    // if restaurant table create successfull then return this message //
    res.status(200).send({ message: 'restaurant create successfull' })
}
)
// get food item by user_id ///
restaurantRouter.get('/food_item/:user_id', async (req, res) => {
    const id = req.params?.user_id;
    const find_res = await db.select({ id: restaurant_table.id }).from(restaurant_table).where(eq(restaurant_table.user_id, Number(id)))
    const res_id = find_res[0]?.id;
    if (!res_id) {
        return res.status(404).send({ message: "Restaurant not found" });
    }
    const Food_items = await db.select().from(food_menu_table).where(eq(food_menu_table.res_id, parseInt(res_id)));
    console.log('food_items::', Food_items)
    if (Food_items.length === 0) {
        return res.status(404).send({ message: 'Food_item not found' })
    }
    res.status(200).send(Food_items)
})

// single food item //
restaurantRouter.get('/single_food_item/:id', async (req, res) => {
    const { id } = req.params;
    const food_id = parseInt(id);
    const single_item = await db.select().from(food_menu_table).where(eq(food_menu_table.id, food_id));
    if (single_item.length === 0) {
        return res.status(404).send({ message: 'Food item is not found!' })
    }
    res.status(200).send(single_item[0]);
})

// post food item ///
restaurantRouter.post('/add_food/:user_id', upload.single('food_image'), async (req, res) => {
    const id = req.params.user_id;
    const find_res = await db.select({ id: restaurant_table.id }).from(restaurant_table).where(eq(restaurant_table.user_id, Number(id)))
    const res_id = find_res[0]?.id;
    if (!res_id) {
        return res.status(404).send({ message: "Restaurant not found" });
    }
    const data = req.body;
    let availableStatus;
    if (data?.available === 'available') {
        availableStatus = true;
    } else {
        availableStatus = false;
    }
    const food_image = await ImageUpload(req.file)
    const formData = {
        res_id,
        category: data?.category,
        food_name: data?.food_name,
        price: Number(data?.price),
        food_image,
        available: availableStatus,
        description: data?.description,
    };
    // console.log('formdata::',formData)
    const insertFood_item = await db.insert(food_menu_table).values(formData).returning()
    if (insertFood_item.length === 0) {
        return res.status(400).send({
            message: "Food item not inserted"
        });
    }
    res.status(200).send({ message: 'Food item inserted' })

})

// food item edit //
restaurantRouter.put('/single_food_item/edit/:id', upload.single('food_image'), async (req, res) => {
    const id = parseInt(req.params.id);
    console.log('id', id)
    const data = req.body;
    let food_image;
    if (req.file) {
        food_image = await ImageUpload(req.file);
    } else {
        food_image = data?.food_image;
    }
    
    const updateData = {
        food_name: data.food_name,
        price: Number(data.price),
        category: data.category,
        available: data.available === "available" && true || false,
        food_image: food_image,
        description: data.description,
    };
    const food_item = await db.update(food_menu_table).set(updateData).where(eq(food_menu_table.id, id)).returning();
    if(food_item.length === 0){
       return res.status(404).send({message:'food_item update Unsuccessfull'}) 
    }
    res.status(200).send({message:'food_item update successfull'})
})

// food item delete //
restaurantRouter.delete('/food_item_delete/:id', async (req, res) => {
    const food_id = parseInt(req.params?.id);
    console.log("food_id type:: ", typeof food_id)
    const delete_Food_item = await db.delete(food_menu_table).where(eq(food_menu_table.id, food_id)).returning();
    if (delete_Food_item.length === 0) {
        return res.status(404).send({ message: 'food item not found' })
    }
    res.status(200).send({ message: 'food item delete successfull' })

})