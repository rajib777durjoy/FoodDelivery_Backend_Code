import express from "express";
import upload from "../middleware/multer.js";
import { ImageUpload } from "../middleware/cloudinaryImage.js";
import { sql } from "../config/db.js";
import { getIO } from "./Socket.js";
import { TokenVerify } from "../middleware/tokenVerifyMiddleware.js";

import verifyOwner from "../middleware/VerifyOwner.js";
import VerifyDeliveryMan from "../middleware/VerifyDeliveryMan.js";
import VerifyCustomer from "../middleware/VerifyCustomer.js";



export const restaurantRouter = express.Router();

restaurantRouter.post('/restaurant_partner', TokenVerify, upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "cover", maxCount: 1 },
]), async (req, res) => {
    const data = req.body;
    console.log('res_data::', data)
    const checkRestaurant = await sql`SELECT * FROM restaurant_table WHERE user_id = ${Number(data?.user_id)};`;
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

    //     // new restaurant table create //
    const createRestaurant = await sql`
  INSERT INTO restaurant_table (
    restaurant_name,
    ownerName,
    user_id,
    phone,
    logo,
    cover,
    description,
    address,
    active
  )
  VALUES (
    ${formData.restaurant_name},
    ${formData.ownerName},
    ${formData.user_id},
    ${formData.phone},
    ${formData.logo},
    ${formData.cover},
    ${formData.description},
    ${formData.address},
    ${true}
  )
  RETURNING *;
`;
    console.log('createrestaurant successfull::', createRestaurant);

    if (!createRestaurant) {
        // restaurant table create unsuccessfull then return this message //
        return res.status(500).send({ message: 'server error' })
    };
    //     // user role update from users_table //
    const userRoleUpdate = await sql`
  UPDATE users_table
  SET role = 'partner'
  WHERE id = ${Number(data?.user_id)}
  RETURNING *;
`;

    // if restaurant table create successfull then return this message //
    res.status(200).send({ message: 'restaurant create successfull' })
}
)
// // View All restaurant // public 
restaurantRouter.get('/view_restaurant', async (req, res) => {
    const restaurant = await sql`
  SELECT * FROM restaurant_table;
`;
    // console.log(restaurant)
    res.status(200).send(restaurant)
})

// view restaurant item // public 
restaurantRouter.get('/view_restaurant_item/:product_id', async (req, res) => {
    const id = parseInt(req.params?.product_id);
    // console.log('resid',id)
    const product = await sql`
  SELECT * FROM restaurant_table
  WHERE id = ${id};`;
    // console.log('product::',product)
    if (product.length === 0) {
        return res.status(500).send({ message: 'product is not found !' })
    }
    res.status(200).send(product[0])
})
// // view restaurant food_item // public 
restaurantRouter.get('/view_restaurant_food_item/:res_id', async (req, res) => {
    const id = parseInt(req.params?.res_id);
    const Food_list = await sql` SELECT 
    fm.id AS food_id,
    fm.category,
    fm.food_name,
    fm.food_image,
    fm.available,
    fm.price,
    r.user_id AS owner_id
  FROM restaurant_table r
  INNER JOIN food_menu_table fm
    ON fm.res_id = ${id};
`;
    console.log('Food_list:', Food_list)
    res.status(200).send(Food_list)
})

// // get food item by user_id ///

restaurantRouter.get('/food_item/:user_id', TokenVerify, verifyOwner, async (req, res) => {
    const id = req.params?.user_id;
    const find_res = await sql`
  SELECT id
  FROM restaurant_table
  WHERE user_id = ${Number(id)};
`;
    const res_id = find_res[0]?.id;
    if (!res_id) {
        return res.status(404).send({ message: "Restaurant not found" });
    }
    const Food_items = await sql`
  SELECT *
  FROM food_menu_table
  WHERE res_id = ${parseInt(res_id)};
`;
    console.log('food_items::', Food_items)
    if (Food_items.length === 0) {
        return res.status(404).send({ message: 'Food_item not found' })
    }
    res.status(200).send(Food_items)
})

// // single food item //
restaurantRouter.get('/single_food_item/:id', TokenVerify, verifyOwner, async (req, res) => {
    const { id } = req.params;
    const food_id = parseInt(id);
    const single_item = await sql`
  SELECT *
  FROM food_menu_table
  WHERE id = ${food_id};
`;
    if (single_item.length === 0) {
        return res.status(404).send({ message: 'Food item is not found!' })
    }
    res.status(200).send(single_item[0]);
})

// // post food item ///
restaurantRouter.post('/add_food/:user_id', upload.single('food_image'), TokenVerify, verifyOwner, async (req, res) => {
    const id = req.params.user_id;
    const find_res = await sql`SELECT *
  FROM restaurant_table
  WHERE user_id = ${Number(id)};
`;
    const res_id = find_res[0]?.id;
    console.log('res_id::',res_id , 'hello world add food :')
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
    //     // console.log('formdata::',formData)
    const insertFood_item = await sql`INSERT INTO food_menu_table (
    res_id,
    category,
    food_name,
    price,
    food_image,
    available,
    description
  )
  VALUES (
    ${formData.res_id},
    ${formData.category},
    ${formData.food_name},
    ${formData.price},
    ${formData.food_image},
    ${formData.available},
    ${formData.description}
  )
  RETURNING *;
`;

    if (insertFood_item.length === 0) {
        return res.status(400).send({
            message: "Food item not inserted"
        });
    }
    res.status(200).send({ message: 'Food item inserted' })

})

// food item edit //
restaurantRouter.put('/single_food_item/edit/:id', TokenVerify, verifyOwner, upload.single('food_image'), async (req, res) => {
    const id = parseInt(req.params.id);
    console.log('id', id)
    const data = req.body;
    let food_image;
    if (req.file) {
        food_image = await ImageUpload(req.file);
    } else {
        food_image = data?.food_image;
    }

    const food_item = await sql`
  UPDATE food_menu_table
  SET
    food_name = ${data.food_name},
    price = ${Number(data.price)},
    category = ${data.category},
    available = ${data.available === "available" ? true : false},
    food_image = ${food_image},
    description = ${data.description}
  WHERE id = ${id}
  RETURNING *;
`;
    if (food_item.length === 0) {
        return res.status(404).send({ message: 'food_item update Unsuccessfull' })
    }
    res.status(200).send({ message: 'food_item update successfull' })
})

// // food item delete //
restaurantRouter.delete('/food_item_delete/:id', TokenVerify, verifyOwner, async (req, res) => {
    const food_id = parseInt(req.params?.id);
    console.log("food_id type:: ", typeof food_id)
    const delete_Food_item = await sql`
  DELETE FROM food_menu_table
  WHERE id = ${food_id}
  RETURNING *;
`;
    if (delete_Food_item.length === 0) {
        return res.status(404).send({ message: 'food item not found' })
    }
    res.status(200).send({ message: 'food item delete successfull' })

})

// // earnign page ---- restaurant owner //
restaurantRouter.get('/earnigs_data/:owner_id', TokenVerify, verifyOwner, async (req, res) => {
    const id = parseInt(req.params?.owner_id);
    const earning_data = await sql`
  SELECT *
  FROM order_table
  WHERE owner_id = ${id};
`;
    console.log('earning::', earning_data)
    if (earning_data.length === 0) {
        return res.status(500).send({ message: 'data is not found !' })
    }
    res.status(200).send(earning_data)
})

restaurantRouter.get('/food_item', async (req, res) => {
    const food = await sql`
  SELECT *
  FROM food_menu_table
  LIMIT 10;
`;
    //   console.log('food items:::',food);
    res.status(200).send(food);

})
restaurantRouter.get('/Allfood_item', async (req, res) => {
    const food = await sql`
  SELECT *
  FROM food_menu_table;
`;
    //   console.log('food items:::',food);
    res.status(200).send(food);

})

restaurantRouter.get('/food_details/:id',TokenVerify, async (req, res) => {
    const id = parseInt(req.params?.id);
    const foodDetails = await sql`
  SELECT *
  FROM food_menu_table
  WHERE id = ${id};
`;
    // console.log('food details:::', foodDetails)
    if (foodDetails.length === 0) {
        return res.status(404).send({ message: 'food is not found !' })
    }
    res.status(200).send(foodDetails[0])
})
// // get addtocart-database-table data //
restaurantRouter.get('/cart_item_list/:email', TokenVerify, VerifyCustomer, async (req, res) => {
    const { email } = req.params;
    if (email !== req.email) {
        return res.status(401).send({ message: 'Unauthorized user access !' })
    }
    // 1️⃣ Get user ID from email
    const user = await sql`
  SELECT id
  FROM users_table
  WHERE email = ${email};
`;

    if (user.length === 0) {
        return res.status(404).send({ message: "User not found" });
    }

    const user_id = user[0].id;

    // 2️⃣ Check if cart items exist
    const cart_item = await sql`
  SELECT *
  FROM addtocart_table
  WHERE user_id = ${user_id};
`;

    if (cart_item.length === 0) {
        return res.status(404).send({ message: "Cart item not found!" });
    }

    // 3️⃣ Get detailed cart items with food info
    const cartItems = await sql`SELECT 
    c.id AS cart_id,
    c.quantity,
    f.id AS food_id,
    f.food_name,
    f.price,
    f.food_image,
    f.category,
    f.description
  FROM addtocart_table c
  INNER JOIN food_menu_table f
    ON c.food_id = f.id
  WHERE c.user_id = ${user_id};
`;

    console.log(cartItems);
    // console.log('cart item join::', cartItems)
    res.status(200).send(cartItems)
})

// /// post in addtocart database table //
restaurantRouter.post('/AddToCart/:id', TokenVerify, async (req, res) => {
    const id = parseInt(req.params?.id); // food_id
    console.log('email',req?.email)
    const { quantity } = req.body; // order item count //
    const user = await sql`select * from users_table where email = ${req?.email} ;`;
    console.log('add to cart user:',user)
    const user_id = user[0].id;
    const isExist = await sql`select * from addtocart_table where food_id = ${id} AND user_id = ${user_id} ;`;
    if (isExist.length > 0) {
        return res.status(200).send({ message: 'This item is already in your cart.' })
    }
    const foodQuery = await sql`select * from food_menu_table where id = ${id} ;`;
    if (foodQuery.length === 0) {
        return res.status(404).send({ message: 'food item is not found !' })
    }
    const data = { food_id: foodQuery[0].id, res_id: foodQuery[0].res_id, user_id, quantity }
    const AddToCart = await sql`INSERT INTO addtocart_table (food_id,res_id,user_id,quantity) VALUES (${data?.food_id},${data?.res_id}, ${data?.user_id}, ${data?.quantity}) RETURNING * ;`;
    if (AddToCart.length === 0) {
        return res.status(404).send({ message: 'Failed to add item to cart ' })
    }
    res.status(200).send({ message: 'Item added to cart successfully' })
})

// // cart item delete //
restaurantRouter.delete('/cart_item_delete/:id', TokenVerify, VerifyCustomer, async (req, res) => {
    const id = parseInt(req.params?.id);

    const delete_item = await sql`DELETE FROM addtocart_table where id = ${id} RETURNING * ;`;
    if (delete_item.length === 0) {
        return res.status(404).send({ message: 'Delete Cart item failed' })
    }
    res.status(200).send({ message: 'Delete successfull' })
})

// // food order system //
restaurantRouter.post('/food_order/:id', TokenVerify, async (req, res) => {
    const id = parseInt(req.params?.id);
    const email = req.email;
    if (!req.email) {
        return res.status(404).send({ message: 'Unauthorize access !' })
    }
    try {
        const data = await sql`SELECT f.id AS food_id,f.food_name,
    f.price,
    r.id AS restaurant_id,
        r.restaurant_name,
        r.user_id
  FROM food_menu f
  INNER JOIN restaurant r
      ON f.res_id = r.id
  WHERE f.id = ${id};
`;

        //         console.log(data);

        const order_food = await sql`INSERT INTO order_table (user_id,food_id) values (${data[0].user_id},${data[0].food_id}) RETURNING * ;`;
        if (order_food.length === 0) {
            return res.status(404).send({ message: "Failed to create order. Please try again." })
        }

        const user_id = data[0].user_id;
        const user = await sql`
  SELECT socket_id
  FROM users
  WHERE id = ${user_id};
`;
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

// // get my order data ///
restaurantRouter.get('/my_payment_inbox/:email', TokenVerify, async (req, res) => {
    const { email } = req.params;
    if (email !== req.email) {
        return res.status(403).send({ message: 'Unauthorized user access !' })
    }

    const user = await sql`select * from users_table where email = ${email} ;`;
    const user_id = user[0].id; // order-table cus_id === paid payment user //
    const order_list = await sql`select * from order_table where cus_id = ${user_id} ;`;
    res.status(200).send(order_list);
})
restaurantRouter.get('/my_order_list/:email', TokenVerify, VerifyCustomer, async (req, res) => {
    const { email } = req.params;
    if (email !== req.email) {
        return res.status(403).send({ message: 'Unauthorized user access !' })
    }
    const user = await sql`select * from users_table where email = ${email} ;`;
    const user_id = user[0].id; // order-table cus_id === paid payment user //
    const order_list = await sql`select * from order_table where cus_id = ${user_id} ;`;
    // console.log('order_list',order_list)
    res.status(200).send(order_list);
})

// get all order list by restaurant owner id //
restaurantRouter.get('/order_list/:id', TokenVerify, verifyOwner, async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (isNaN(id)) {
            return res.status(400).send({ message: "Invalid user id" });
        }
      const orderWithFood = await sql`SELECT 
      o.id AS order_id,
      o.quantity,
      o.payment,
      o.dueAmount,
      o.customer_phone,
      o.payment_tran_id,
      o.payment_status,
      o.status,
      f.food_name,
      f.food_image
  FROM order_table o
  INNER JOIN food_menu_table f
      ON o.food_id = f.id
  WHERE o.owner_id = ${id};
`;

        res.status(200).send(orderWithFood);
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

// /// all order list for delivery dashboard panel ///
restaurantRouter.get('/all_order_list', TokenVerify, VerifyDeliveryMan, async (req, res) => {

    const user = await sql`select * from users_table where email=${req?.email};`;
    if (user.length === 0) {
        return res.status(400).send({ message: 'user is not found' })
    }
    const user_id = user[0].id;

    const deliverInfo = await sql`select * from delivery_table where user_id = ${user_id} ;`;
    if (deliverInfo.length === 0) {
        return res.status(400).send({ message: 'deliverInfo is not found' })
    }
    const delivery_id = deliverInfo[0].id;
    const orderWithFood = await sql`
  SELECT 
      o.id AS order_id,
      o.quantity,
      o.payment,
      o.dueAmount,
      o.customer_phone,
      o.payment_tran_id,
      o.payment_status,
      o.delivery_location,
      o.status,
      f.food_name,
      f.food_image
  FROM orders o
  INNER JOIN food_menu f
      ON o.food_id = f.id
  WHERE o.delivery_id = ${delivery_id};
`;

    if (orderWithFood.length === 0) {
        return res.status(404).send({ message: 'order food is not found !' })
    }
    console.log('order for delivery page::', orderWithFood);
    res.status(200).send(orderWithFood);
})

// Owner static page  ///
restaurantRouter.get('/owner_static_page/:Owner_id', TokenVerify, verifyOwner, async (req, res) => {
    const id = parseInt(req.params?.Owner_id);
    const order = await sql`select * from order_table where owner_id = ${id} ;`;
    if (order.length === 0) {
        return res.status(200).send({ message: 'Order is not found !' })
    }
    res.status(200).send(order)

})

restaurantRouter.get('/customer_static_page/:cus_id', TokenVerify, VerifyCustomer, async (req, res) => {
    const Id = Number(req.params?.cus_id);

    const orders = await sql`
  SELECT 
      o.id AS order_id,
      o.food_id,
      d.name AS deliveryMan_name,
      d.phone AS deliveryMan_phone,
      o.dueAmount AS DueAmount,
      o.status,
      o.OTP
  FROM orders o
  INNER JOIN delivery d
      ON o.delivery_id = d.id
  WHERE o.cus_id = ${Id};
`;

    console.log("cus_order list ::", orders);

    res.status(200).send(orders);
})
