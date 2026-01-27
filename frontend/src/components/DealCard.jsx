// src/components/DealCard.jsx - UPDATED VERSION
import { useCart } from "../context/CartContext";
import { useState } from "react";
import { 
  Star, 
  Timer, 
  Favorite, 
  FavoriteBorder,
  ShoppingCart,
  Restaurant,
  LocalPizza,
  Fastfood
} from "@mui/icons-material";
import { 
  IconButton, 
  Chip, 
  Typography,
  Button,
  Tooltip,
  Box
} from "@mui/material";
import DealDialog from "./DealDialog";

export const DealCard = ({ deal, onFavoriteToggle, isFavorite }) => {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [openDealDialog, setOpenDealDialog] = useState(false);

  // Calculate discount percentage
  const calculateDiscountPercent = () => {
    if (deal.discount_percent) return deal.discount_percent;
    if (deal.original_price && deal.discount_price) {
      const discount = ((deal.original_price - deal.discount_price) / deal.original_price) * 100;
      return Math.round(discount);
    }
    return 0;
  };

  const discountPercent = calculateDiscountPercent();

  // Get display price
  const getDisplayPrice = () => {
    if (deal.discount_price) return deal.discount_price;
    if (deal.price) return deal.price;
    if (deal.original_price) return deal.original_price;
    return 0;
  };

  const displayPrice = getDisplayPrice();

  // Determine if deal is customizable
  const isCustomizable = () => {
    const title = (deal.title || "").toLowerCase();
    const description = (deal.description || "").toLowerCase();
    const tags = (deal.tags || "").toLowerCase();
    
    // Pizza deals, burger deals, and combos are customizable
    const hasPizza = title.includes('pizza') || description.includes('pizza') || tags.includes('pizza');
    const hasBurger = title.includes('burger') || description.includes('burger') || tags.includes('burger');
    const hasCombo = title.includes('combo') || description.includes('combo') || tags.includes('combo');
    
    return hasPizza || hasBurger || hasCombo;
  };

  // Get deal type for display
  const getDealType = () => {
    const title = (deal.title || "").toLowerCase();
    const description = (deal.description || "").toLowerCase();
    const tags = (deal.tags || "").toLowerCase();
    
    const hasPizza = title.includes('pizza') || description.includes('pizza') || tags.includes('pizza');
    const hasBurger = title.includes('burger') || description.includes('burger') || tags.includes('burger');
    const hasCombo = title.includes('combo') || description.includes('combo') || tags.includes('combo');
    
    if (hasPizza && hasBurger) return 'pizza-burger-combo';
    if (hasPizza && !hasBurger) return 'pizza';
    if (hasBurger && !hasPizza) return 'burger';
    if (hasCombo) return 'combo';
    return 'general';
  };

  const dealType = getDealType();

  // Get button text
  const getButtonText = () => {
    if (added) return 'âœ“ Added';
    
    if (!isCustomizable()) {
      return 'Add to Cart';
    }
    
    switch (dealType) {
      case 'pizza':
        return 'Customize Pizza';
      case 'burger':
        return 'Customize Burger';
      case 'pizza-burger-combo':
        return 'Customize Combo';
      default:
        return 'Customize Deal';
    }
  };

  // Get icon based on deal type
  const getDealIcon = () => {
    switch (dealType) {
      case 'pizza':
        return 'ðŸ•';
      case 'burger':
        return 'ðŸ”';
      case 'pizza-burger-combo':
        return 'ðŸ•ðŸ”';
      case 'combo':
        return 'ðŸ½ï¸';
      default:
        return 'ðŸ”¥';
    }
  };

  // Get badge color based on deal type
  const getBadgeColor = () => {
    switch (dealType) {
      case 'pizza':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'burger':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'pizza-burger-combo':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'combo':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Handle add to cart
  const handleAddToCart = () => {
    if (!isCustomizable()) {
      // Add directly to cart for non-customizable deals
      const dealItem = {
        id: deal.id,
        name: deal.title || deal.name,
        image: deal.image,
        price: Number(displayPrice),
        original_price: deal.original_price ? Number(deal.original_price) : null,
        discount_percent: discountPercent,
        restaurant: deal.restaurant_name || deal.restaurant || "Restaurant",
        restaurant_id: deal.restaurant_id,
        description: deal.description,
        tags: deal.tags,
        selectedToppings: [],
        option: null,
        quantity: 1,
        isDeal: true,
        hasCustomization: false
      };

      addToCart(dealItem);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } else {
      // Open customization dialog
      setOpenDealDialog(true);
    }
  };

  // Handle customization completion
  const handleCustomizationComplete = (customizedData) => {
    const dealItem = {
      id: deal.id,
      name: deal.title || deal.name,
      image: deal.image,
      price: Number(customizedData.finalTotal),
      original_price: deal.original_price ? Number(deal.original_price) : null,
      discount_percent: discountPercent,
      restaurant: deal.restaurant_name || deal.restaurant || "Restaurant",
      restaurant_id: deal.restaurant_id,
      description: deal.description,
      tags: deal.tags,
      quantity: customizedData.quantity,
      isDeal: true,
      hasCustomization: true,
      customizedData: customizedData,
      dealType: dealType
    };

    addToCart(dealItem);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
    setOpenDealDialog(false);
  };

  const handleFavoriteToggle = (e) => {
    e.stopPropagation();
    if (onFavoriteToggle) {
      onFavoriteToggle(deal.id, e);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 h-full flex flex-col">
        {/* Deal Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={deal.image || "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop"}
            alt={deal.title || deal.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
          
          {/* Discount Badge */}
          {discountPercent > 0 && (
            <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full font-bold text-sm shadow-lg">
              {discountPercent}% OFF
            </div>
          )}

          {/* Deal Type Badge */}
          <div className="absolute top-3 right-3">
            <Chip 
              label={`${getDealIcon()} ${dealType === 'pizza-burger-combo' ? 'Combo' : dealType}`}
              size="small"
              className={getBadgeColor()}
            />
          </div>

          {/* Favorite Button */}
          <div className="absolute top-12 right-3">
            <IconButton
              onClick={handleFavoriteToggle}
              className="bg-white/80 hover:bg-white"
              size="small"
            >
              {isFavorite ? (
                <Favorite className="text-red-500" />
              ) : (
                <FavoriteBorder className="text-gray-600" />
              )}
            </IconButton>
          </div>

          {/* Restaurant Info */}
          {deal.restaurant_name && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
              <div className="flex items-center text-white">
                <Restaurant className="text-sm mr-2" />
                <span className="text-sm font-medium truncate">
                  {deal.restaurant_name}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Deal Info */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Deal Title */}
          <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-1">
            {deal.title || deal.name}
          </h3>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-3 line-clamp-2 flex-1">
            {deal.description || "Special offer available"}
          </p>

          {/* Price Display */}
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <Typography variant="h5" className="font-bold text-gray-900">
                Rs. {displayPrice.toLocaleString()}
              </Typography>

              {deal.original_price && deal.original_price > displayPrice && (
                <Typography
                  variant="body2"
                  className="text-gray-500 line-through"
                >
                  Rs. {deal.original_price.toLocaleString()}
                </Typography>
              )}
            </div>

            {/* Save Amount */}
            {deal.original_price && deal.original_price > displayPrice && (
              <Typography variant="caption" className="text-green-600 font-medium">
                Save Rs. {(deal.original_price - displayPrice).toLocaleString()}
              </Typography>
            )}
          </div>

          {/* Tags */}
          {deal.tags && (
            <div className="flex flex-wrap gap-1 mb-3">
              {deal.tags.split(',').map((tag, index) => (
                <Chip
                  key={index}
                  label={tag.trim()}
                  size="small"
                  variant="outlined"
                  className="text-xs"
                />
              ))}
            </div>
          )}

          {/* Validity */}
          {deal.valid_until && (
            <div className="mb-3 flex items-center text-gray-500 text-sm">
              <Timer className="mr-1" fontSize="small" />
              <span>Valid until: {new Date(deal.valid_until).toLocaleDateString()}</span>
            </div>
          )}

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            variant="contained"
            fullWidth
            startIcon={<ShoppingCart />}
            className={`
              ${added ? 'bg-green-600 hover:bg-green-700' : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'}
              text-white font-bold py-2.5 rounded-xl transition-all duration-300
              ${added ? 'scale-105' : ''}
              ${isCustomizable() ? 'mt-auto' : ''}
            `}
            size="large"
          >
            {getButtonText()}
          </Button>

          {/* Customization Info */}
          {isCustomizable() && (
            <Typography variant="caption" className="block text-center mt-2 text-blue-600">
              âœ“ Click to customize
            </Typography>
          )}
        </div>
      </div>

      {/* Deal Customization Dialog */}
      {isCustomizable() && (
        <DealDialog
          open={openDealDialog}
          onClose={() => setOpenDealDialog(false)}
          deal={deal}
          onCustomizationComplete={handleCustomizationComplete}
        />
      )}
    </>
  );
};


