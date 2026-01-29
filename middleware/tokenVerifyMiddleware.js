import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
export const TokenVerify = (req,res,next)=>{
const token = req.cookies?.token;
if(!token){
return res.status(401).send({ message: "Unauthorized" });
}

  jwt.verify(token,process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Invalid token" });
    }
    req.email = decoded?.email;
    return next();
  });
  
}