
import { sql } from "../config/db.js";

const VerifyCustomer =async (req,res,next) => {
    const email = req?.email;
   const user = await sql`select * from users_table where email=${email};`;
        if (user.length === 0) {
            return res.status(401).send({ message: 'Unauthorized user access !' })
        }
        if (user[0]?.role === 'customer') {
            return next()
        }
        return res.status(403).send({ message: "Access denied! Only Customer allowed." });
    
};

export default VerifyCustomer;