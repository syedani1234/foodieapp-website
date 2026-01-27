import API_BASE_URL from './config/api';

/**
 * Format image URLs to ensure they're properly formed
 * @param {string} url - Image URL or path
 * @returns {string} Formatted URL
 */
export const formatImageUrl = (url) => {
  if (!url || url === "null" || url === "undefined") {
    return "/images/placeholder.jpg";
  }
  
  // If already a full URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If starts with /uploads, prepend server URL
  if (url.startsWith('/uploads/')) {
    return `${import.meta.env.VITE_API_URL || "http://localhost:4000"}${url}`;
  }
  
  // If relative path without leading slash, add it
  if (!url.startsWith('/') && !url.startsWith('http')) {
    return `/${url}`;
  }
  
  return url;
};

/**
 * Handle image loading errors
 * @param {Event} e - Image error event
 */
export const handleImageError = (e) => {
  const defaultImages = {
    cuisine: "/images/cuisine-placeholder.jpg",
    restaurant: "/images/restaurant-placeholder.jpg",
    deal: "/images/deal-placeholder.jpg",
    default: "/images/placeholder.jpg"
  };
  
  // Try to determine image type from className or parent
  const imgElement = e.target;
  let imageType = "default";
  
  if (imgElement.classList.contains('cuisine-img')) imageType = "cuisine";
  else if (imgElement.classList.contains('restaurant-img')) imageType = "restaurant";
  else if (imgElement.classList.contains('deal-img')) imageType = "deal";
  
  imgElement.src = defaultImages[imageType] || defaultImages.default;
  imgElement.onerror = null; // Prevent infinite loop
};

/**
 * Generate placeholder image URL based on type
 * @param {string} type - Image type (cuisine, restaurant, deal, dish)
 * @param {string} text - Optional text for placeholder
 * @returns {string} Placeholder URL
 */
export const getPlaceholderImage = (type = "default", text = "") => {
  const colors = {
    cuisine: "4CAF50",
    restaurant: "2196F3",
    deal: "FF9800",
    dish: "9C27B0",
    default: "607D8B"
  };
  
  const color = colors[type] || colors.default;
  const encodedText = encodeURIComponent(text || type.charAt(0).toUpperCase() + type.slice(1));
  
  return `https://via.placeholder.com/300x200/${color}/FFFFFF?text=${encodedText}`;
};


