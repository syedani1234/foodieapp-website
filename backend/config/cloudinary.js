import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dppoj8vb3',
  api_key: process.env.CLOUDINARY_API_KEY || '848759657246974',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'sZ_TfhP1ny-09Eo6SO9TnROXVk8',
});

export const uploadToCloudinary = (buffer, folder = 'foodieapp') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    uploadStream.end(buffer);
  });
};

export default cloudinary;