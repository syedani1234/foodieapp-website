export const errorHandler = (err, req, res, next) => {
  console.error('❌ Server error:', err);

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File too large',
      message: 'Maximum file size is 5MB',
    });
  }

  // Multer file type error (custom from fileFilter)
  if (err.message && err.message.includes('Only images allowed')) {
    return res.status(400).json({
      error: 'Invalid file type',
      message: err.message,
    });
  }

  // General server error
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
};