import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cloudinary.config({
  cloud_name: 'dppoj8vb3',
  api_key: '848759657246974',
  api_secret: 'sZ_TfhP1ny-09Eo6SO9TnROXVk8',
});

// Use your actual folder path (Windows style)
const imagesFolder = 'C:\\Users\\Daniyal\\Desktop\\uploads';

async function uploadAll() {
  const files = fs.readdirSync(imagesFolder);
  for (const file of files) {
    const filePath = path.join(imagesFolder, file);
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'foodieapp',
    });
    console.log(`Uploaded ${file} -> ${result.secure_url}`);
  }
  console.log('✅ All images uploaded to Cloudinary!');
}

uploadAll().catch(console.error);