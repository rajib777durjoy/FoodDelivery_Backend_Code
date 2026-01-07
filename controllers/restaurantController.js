import express from "express";
import upload from "../middleware/multer.js";
import { ImageUpload } from "../middleware/cloudinaryImage.js";
import { db } from "../config/db.js";
import { food_menu_table, order_table, restaurant_table } from "../models/restaurantModel.js";
import { and, eq } from "drizzle-orm";
import { users_table } from "../models/userModel.js";
import AddToCart_table from "../models/AddToCartModal.js";
import { getIO } from "./Socket.js";
import { TokenVerify } from "../middleware/tokenVerifyMiddleware.js";


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
    if (food_item.length === 0) {
        return res.status(404).send({ message: 'food_item update Unsuccessfull' })
    }
    res.status(200).send({ message: 'food_item update successfull' })
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

restaurantRouter.get('/food_item', async (req, res) => {
    const food = await db.select().from(food_menu_table).limit(10);
    //   console.log('food items:::',food);
    res.status(200).send(food);

})
restaurantRouter.get('/Allfood_item', async (req, res) => {
    const food = await db.select().from(food_menu_table);
    //   console.log('food items:::',food);
    res.status(200).send(food);

})

restaurantRouter.get('/food_details/:id', async (req, res) => {
    const id = parseInt(req.params?.id);
    const foodDetails = await db.select().from(food_menu_table).where(eq(food_menu_table.id, id));
    // console.log('food details:::', foodDetails)
    if (foodDetails.length === 0) {
        return res.status(404).send({ message: 'food is not found !' })
    }
    res.status(200).send(foodDetails[0])
})
// get addtocart-database-table data //
restaurantRouter.get('/cart_item_list/:email', TokenVerify, async (req, res) => {
    const { email } = req.params;
    if (email !== req.email) {
        return res.status(401).send({ message: 'Unauthorized user access !' })
    }
    const user = await db.select().from(users_table).where(eq(users_table.email, email));
    const user_id = user[0].id;
    const cart_item = await db.select().from(AddToCart_table).where(eq(AddToCart_table.user_id, user_id));
    if (cart_item.length === 0) {
        return res.status(404).send({ message: 'Cart_item is not found !' })
    }
    const cartItems = await db
        .select({
            cart_id: AddToCart_table.id,
            quantity: AddToCart_table.quantity,
            food_id: food_menu_table.id,
            food_name: food_menu_table.food_name,
            price: food_menu_table.price,
            food_image: food_menu_table.food_image,
            category: food_menu_table.category,
            description: food_menu_table.description,
        })
        .from(AddToCart_table)
        .innerJoin(food_menu_table, eq(AddToCart_table.food_id, food_menu_table.id))
        .where(eq(AddToCart_table.user_id, user_id));
    // console.log('cart item join::', cartItems)
    res.status(200).send(cartItems)
})
/// post in addtocart database table //
restaurantRouter.post('/AddToCart/:id', TokenVerify, async (req, res) => {
    const id = parseInt(req.params?.id); // food_id
    const { quantity } = req.body; // order item count //
    const user = await db.select().from(users_table).where(eq(users_table.email, req?.email));
    const user_id = user[0].id;
    const isExist = await db.select().from(AddToCart_table).where(and(eq(AddToCart_table.food_id, id), eq(AddToCart_table.user_id, user_id)));
    if (isExist.length > 0) {
        return res.status(200).send({ message: 'This item is already in your cart.' })
    }
    const foodQuery = await db.select().from(food_menu_table).where(eq(food_menu_table.id, id));
    if (foodQuery.length === 0) {
        return res.status(404).send({ message: 'food item is not found !' })
    }
    const data = { food_id: foodQuery[0].id, res_id: foodQuery[0].res_id, user_id, quantity }
    const AddToCart = await db.insert(AddToCart_table).values(data).returning()
    if (AddToCart.length === 0) {
        return res.status(404).send({ message: 'Failed to add item to cart ' })
    }
    res.status(200).send({ message: 'Item added to cart successfully' })
})

// cart item delete //
restaurantRouter.delete('/cart_item_delete/:id', async (req, res) => {
    const id = parseInt(req.params?.id);
    const delete_item = await db.delete(AddToCart_table).where(eq(AddToCart_table.id, id)).returning();
    if (delete_item.length === 0) {
        return res.status(404).send({ message: 'Delete Cart item failed' })
    }
    res.status(200).send({ message: 'Delete successfull' })
})

// food order system //
restaurantRouter.post('/food_order/:id', TokenVerify, async (req, res) => {
    const id = parseInt(req.params?.id);
    const email = req.email;
    if (!req.email) {
        return res.status(404).send({ message: 'Unauthorize access !' })
    }
    try {
        const data = await db
            .select({
                food_id: food_menu_table.id,
                food_name: food_menu_table.food_name,
                price: food_menu_table.price,
                restaurant_id: restaurant_table.id,
                restaurant_name: restaurant_table.restaurant_name,
                user_id: restaurant_table.user_id
            })
            .from(food_menu_table)
            .innerJoin(
                restaurant_table,
                eq(food_menu_table.res_id, restaurant_table.id)
            )
            .where(eq(food_menu_table.id, id));

        console.log(data);

        // const order_food= await db.insert(order_table).values({user_id:data[0].user_id,food_id:data[0].food_id}).returning();
        // if(order_food.length === 0){
        //     return res.status(404).send({message:"Failed to create order. Please try again."})
        // }

        const user_id = data[0].user_id;
        const user = await db.select({ socket_id: users_table.socket_id }).from(users_table).where(eq(users_table.id, user_id));
        console.log('user order::', user)

        const io = await getIO();

        if (user.length && user[0].socket_id) {
            const socket_id = user[0].socket_id;
            io.to(socket_id).emit('notification', { message: 'new order request !!' });
        } else {
            console.log('User is not connected via socket');
        }

    } catch (err) {
        console.log('error', err)
    }


})

// get my order data ///
restaurantRouter.get('/my_order_list/:email', TokenVerify, async (req, res) => {
    const { email } = req.params;
    if (email !== req.email) {
        return res.status(403).send({ message: 'Unauthorized user access !' })
    }
    const user = await db.select().from(users_table).where(eq(users_table.email, email));
    const user_id = user[0].id;
    const order_list = await db.select().from(order_table).where(eq(order_table.user_id, user_id));
    res.status(200).send(order_list);
})

// get all order list by restaurant owner id //


restaurantRouter.get('/order_list/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (isNaN(id)) {
            return res.status(400).send({ message: "Invalid user id" });
        }

        const orderWithFood = await db
            .select({
                order_id: order_table.id,
                quantity: order_table.quantity,
                payment: order_table.payment,
                dueAmount: order_table.dueAmount,
                customer_phone: order_table.customer_phone,
                payment_tran_id: order_table.payment_tran_id,
                payment_status: order_table.payment_status,

                food_name: food_menu_table.food_name,
                food_image: food_menu_table.food_image,
            })
            .from(order_table)
            .innerJoin(
                food_menu_table,
                eq(order_table.food_id, food_menu_table.id)
            )
            .where(eq(order_table.user_id, id));
        if (orderWithFood.length === 0) {
            return res.status(404).send({ message: 'order is not found' });
        }
        console.log('orderfood::', orderWithFood)

        res.status(200).send(orderWithFood);

    } catch (error) {
        console.error("Order List Error:", error);
        res.status(500).send({ message: "Internal server error" });
    }
});

/// all order list for delivery dashboard panel ///
restaurantRouter.get('/all_order_list', async (req, res) => {
    const orderWithFood = await db
        .select({
            order_id: order_table.id,
            quantity: order_table.quantity,
            payment: order_table.payment,
            dueAmount: order_table.dueAmount,
            customer_phone: order_table.customer_phone,
            payment_tran_id: order_table.payment_tran_id,
            payment_status: order_table.payment_status,
            delivery_location:order_table.delivery_location,
            status:order_table.status,
            food_name: food_menu_table.food_name,
            food_image: food_menu_table.food_image,
        })
        .from(order_table)
        .innerJoin(
            food_menu_table,
            eq(order_table.food_id, food_menu_table.id)
        ) ;
    if(orderWithFood.length === 0){
        return res.status(404).send({message:'order food is not found !'})
    }
    console.log('order for delivery page::',orderWithFood);
    res.status(200).send(orderWithFood);
})
