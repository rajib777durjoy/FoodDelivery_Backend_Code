
import { sql } from "../config/db.js";


const VerifyDeliveryMan = async (req, res, next) => {
    const email = req?.email;

    const user = await sql`select * from users_table  where email = ${email} ;` ;
    if (user.length === 0) {
        return res.status(401).send({ message: 'Unauthorized user access !' })
    }
    if (user[0]?.role === 'deliver_hero') {
        return next();
    }
    return res.status(403).send({ message: "Access denied! Only deliver_hero allowed." });
};

export default VerifyDeliveryMan;