import { eq } from "drizzle-orm";
import { db } from "../config/db.js";
import { users_table } from "../models/userModel.js";

const VerifyDeliveryMan = async (req, res, next) => {
    const email = req?.email;
    const user = await db.select().from(users_table).where(eq(users_table.email, email));
    if (user.length === 0) {
        return res.status(401).send({ message: 'Unauthorized user access !' })
    }
    if (user[0]?.role === 'deliver_hero') {
        return next();
    }
    return res.status(403).send({ message: "Access denied! Only deliver_hero allowed." });
};

export default VerifyDeliveryMan;