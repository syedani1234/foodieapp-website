import { uploadToCloudinary } from '../config/cloudinary.js';

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const result = await uploadToCloudinary(req.file.buffer, 'foodieapp');
    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        imageUrl: result.secure_url,
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file', message: error.message });
  }
};