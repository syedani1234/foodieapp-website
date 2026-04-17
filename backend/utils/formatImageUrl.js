export const formatImageUrl = (imagePath, req) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  let baseUrl;
  if (req && req.protocol && req.get('host')) {
    baseUrl = `${req.protocol}://${req.get('host')}`;
  } else {
    baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
  }
  return `${baseUrl}${normalizedPath}`;
};