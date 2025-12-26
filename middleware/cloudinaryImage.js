import { v2 as cloudinary } from 'cloudinary';
import dotenv from "dotenv";
dotenv.config();

// cloudinary api key //
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_SECRET_API_KEY
});

export const ImageUpload = async (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "restaurants" }, 
      (error, result) => {
        if (result) resolve(result?.secure_url);   
        else reject(error);           
      }
    );

    stream.end(file.buffer); 
  });
};

