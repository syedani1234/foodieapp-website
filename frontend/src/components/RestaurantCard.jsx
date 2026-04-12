// src/components/RestaurantCard.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  IconButton,
  Rating,
  Tooltip,
  Button
} from "@mui/material";
import {
  Favorite,
  FavoriteBorder,
  Restaurant,
  AccessTime,
  DeliveryDining,
  Star,
  LocationOn,
  Info,
  RestaurantMenu,
  LocalOffer
} from "@mui/icons-material";
import DealDialog from './DealDialog'; // Import DealDialog

export const RestaurantCard = ({ restaurant, onFavoriteToggle, isFavorite, onDealClick }) => {
  const [imageError, setImageError] = useState(false);
  const [dealDialogOpen, setDealDialogOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);

  // Format delivery fee - use actual data from API
  const formatDeliveryFee = (fee) => {
    if (fee === undefined || fee === null) return "Delivery fee";
    if (fee === 0 || fee === '0') return 'Free delivery';
    
    // Check if fee is a string containing currency symbol
    if (typeof fee === 'string') {
      if (fee.toLowerCase().includes('free')) return 'Free delivery';
      return fee;
    }
    
    // If it's a number, format it
    return `₹${parseFloat(fee).toFixed(2)} delivery`;
  };

  // Format rating display
  const getRatingDisplay = (rating) => {
    if (!rating || rating === 0 || rating === '0') {
      return { display: "No ratings yet", value: 0, hasRating: false };
    }
    
    const ratingNum = parseFloat(rating);
    return { 
      display: `${ratingNum.toFixed(1)} ⭐`, 
      value: ratingNum, 
      hasRating: true 
    };
  };

  // Format delivery time
  const formatDeliveryTime = (time) => {
    if (!time) return "30-45 min";
    
    // Handle different time formats
    if (typeof time === 'number') {
      return `${time}-${time + 15} min`;
    }
    
    if (typeof time === 'string') {
      if (time.includes('-')) return `${time} min`;
      return `${time}-${parseInt(time) + 15} min`;
    }
    
    return "30-45 min";
  };

  // Format min order amount
  const formatMinOrder = (amount) => {
    if (!amount || amount === 0) return "No minimum";
    if (typeof amount === 'string' && amount.toLowerCase().includes('no')) return "No minimum";
    return `Min. ₹${parseFloat(amount).toFixed(2)}`;
  };

  // Get status text and color
  const getStatusInfo = (restaurant) => {
    if (!restaurant.has_menu) {
      return { text: "Menu Updating", color: "warning", variant: "outlined" };
    }
    if (restaurant.is_open) {
      return { text: "Open Now", color: "success", variant: "filled" };
    }
    return { text: "Closed", color: "error", variant: "filled" };
  };

  // Handle deal click
  const handleDealClick = (dealId) => {
    if (dealId && onDealClick) {
      onDealClick(dealId);
    } else if (restaurant.deal_count > 0 && restaurant.id) {
      // If no specific deal ID provided but restaurant has deals, show deals page
      setSelectedDeal({ restaurantId: restaurant.id });
      setDealDialogOpen(true);
    }
  };

  // Handle specific deal selection
  const handleSpecificDealClick = (dealId) => {
    setSelectedDeal(dealId);
    setDealDialogOpen(true);
  };

  // Helper values
  const ratingInfo = getRatingDisplay(restaurant.rating);
  const deliveryFeeText = formatDeliveryFee(restaurant.delivery_fee);
  const deliveryTimeText = formatDeliveryTime(restaurant.delivery_time);
  const minOrderText = formatMinOrder(restaurant.min_order_amount);
  const statusInfo = getStatusInfo(restaurant);
  
  // Fallback image
  const fallbackImage = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=225&fit=crop";

  return (
    <>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.2s, box-shadow 0.2s',
          borderRadius: 2,
          overflow: 'hidden',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 4,
          },
        }}
      >
        {/* Image with Favorite Button */}
        <Box sx={{ position: 'relative' }}>
          <CardMedia
            component="img"
            height="180"
            image={imageError ? fallbackImage : (restaurant.image || fallbackImage)}
            alt={restaurant.name}
            onError={() => setImageError(true)}
            sx={{ 
              objectFit: 'cover',
              width: '100%',
              transition: 'transform 0.3s',
              '&:hover': {
                transform: 'scale(1.05)'
              }
            }}
          />
          
          {/* Favorite Button */}
          <Tooltip title={isFavorite ? "Remove from favorites" : "Add to favorites"}>
            <IconButton
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: 'rgba(255,255,255,0.95)',
                '&:hover': { 
                  backgroundColor: 'white',
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.2s'
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onFavoriteToggle) onFavoriteToggle();
              }}
              size="small"
            >
              {isFavorite ? (
                <Favorite sx={{ color: 'error.main' }} />
              ) : (
                <FavoriteBorder sx={{ color: 'text.secondary' }} />
              )}
            </IconButton>
          </Tooltip>
          
          {/* Cuisine Badge */}
          {restaurant.cuisine_name && (
            <Chip
              label={restaurant.cuisine_name}
              size="small"
              sx={{
                position: 'absolute',
                bottom: -12,
                left: 12,
                backgroundColor: 'primary.main',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.7rem',
                height: 24,
                '& .MuiChip-label': {
                  px: 1.5,
                  py: 0.5
                }
              }}
            />
          )}
        </Box>
        
        {/* Content */}
        <CardContent sx={{ 
          flexGrow: 1, 
          pt: restaurant.cuisine_name ? 3 : 2,
          pb: 2,
          '&:last-child': { pb: 2 }
        }}>
          {/* Restaurant Name */}
          <Typography
            component={Link}
            to={`/restaurants/${restaurant.id}`}
            variant="h6"
            fontWeight="bold"
            gutterBottom
            sx={{
              color: 'text.primary',
              textDecoration: 'none',
              display: 'block',
              lineHeight: 1.3,
              mb: 1.5,
              '&:hover': {
                color: 'primary.main',
              }
            }}
          >
            {restaurant.name}
          </Typography>
          
          {/* Status & Menu Info */}
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Chip
              label={statusInfo.text}
              size="small"
              color={statusInfo.color}
              variant={statusInfo.variant}
              sx={{ 
                fontSize: '0.7rem',
                height: 22,
                fontWeight: 500
              }}
            />
            
            {restaurant.has_menu && restaurant.menu_item_count > 0 && (
              <Tooltip title={`${restaurant.menu_item_count} menu items available`}>
                <Chip
                  icon={<RestaurantMenu sx={{ fontSize: 14 }} />}
                  label={`${restaurant.menu_item_count} items`}
                  size="small"
                  variant="outlined"
                  sx={{ 
                    fontSize: '0.7rem',
                    height: 22,
                    borderColor: 'primary.light',
                    color: 'primary.main'
                  }}
                />
              </Tooltip>
            )}
          </Box>
          
          {/* Rating */}
          <Box display="flex" alignItems="center" mb={1.5}>
            {ratingInfo.hasRating ? (
              <>
                <Rating
                  value={ratingInfo.value}
                  precision={0.5}
                  readOnly
                  size="small"
                  sx={{ mr: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {ratingInfo.display}
                </Typography>
              </>
            ) : (
              <Box display="flex" alignItems="center">
                <Star sx={{ 
                  fontSize: 16, 
                  color: 'text.disabled', 
                  mr: 0.5 
                }} />
                <Typography variant="body2" color="text.secondary">
                  {ratingInfo.display}
                </Typography>
              </Box>
            )}
          </Box>
          
          {/* Location */}
          {restaurant.location && (
            <Box display="flex" alignItems="flex-start" mb={1.5}>
              <LocationOn sx={{ 
                fontSize: 16, 
                color: 'text.secondary', 
                mr: 1,
                mt: 0.25 
              }} />
              <Typography variant="body2" color="text.secondary">
                {restaurant.location.length > 35 
                  ? `${restaurant.location.substring(0, 35)}...` 
                  : restaurant.location}
              </Typography>
            </Box>
          )}
          
          {/* Delivery & Pricing Info */}
          <Box sx={{ 
            backgroundColor: 'grey.50',
            borderRadius: 1,
            p: 1.5,
            mb: 2
          }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Box display="flex" alignItems="center">
                <AccessTime sx={{ 
                  fontSize: 16, 
                  color: 'primary.main', 
                  mr: 1 
                }} />
                <Typography variant="body2" fontWeight="medium">
                  {deliveryTimeText}
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center">
                <DeliveryDining sx={{ 
                  fontSize: 16, 
                  color: 'primary.main', 
                  mr: 1 
                }} />
                <Typography variant="body2" fontWeight="medium">
                  {deliveryFeeText}
                </Typography>
              </Box>
            </Box>
            
            {/* Minimum Order */}
            <Box display="flex" alignItems="center" justifyContent="center">
              <Info sx={{ 
                fontSize: 14, 
                color: 'text.secondary', 
                mr: 0.5 
              }} />
              <Typography variant="caption" color="text.secondary">
                {minOrderText}
              </Typography>
            </Box>
          </Box>
          
          {/* Description */}
          {restaurant.description && restaurant.description !== "Menu Updating" && (
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{
                mb: 2,
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {restaurant.description}
            </Typography>
          )}
          
          {/* Action Buttons */}
          <Box display="flex" justifyContent="space-between" alignItems="center" gap={1} mt="auto">
            {/* View Menu Button */}
            <Button
              component={Link}
              to={`/restaurants/${restaurant.id}`}
              variant="outlined"
              size="small"
              fullWidth
              sx={{
                borderColor: 'primary.main',
                color: 'primary.main',
                fontWeight: 'bold',
                '&:hover': {
                  borderColor: 'primary.dark',
                  backgroundColor: 'primary.light',
                  color: 'primary.dark'
                }
              }}
            >
              View Menu
            </Button>
            
            {/* View Deals Button - Only show if restaurant has deals */}
            {restaurant.deal_count > 0 && (
              <Button
                variant="contained"
                size="small"
                fullWidth
                onClick={() => handleDealClick(restaurant.id)}
                startIcon={<LocalOffer />}
                sx={{
                  backgroundColor: '#ff9800',
                  color: 'white',
                  fontWeight: 'bold',
                  '&:hover': {
                    backgroundColor: '#e68900'
                  }
                }}
              >
                View Deals ({restaurant.deal_count})
              </Button>
            )}
          </Box>
          
          {/* Deals Chip - Alternative display */}
          {restaurant.deal_count > 0 && (
            <Box display="flex" justifyContent="center" mt={2}>
              <Chip
                icon={<LocalOffer />}
                label={`${restaurant.deal_count} Active Deals`}
                size="small"
                color="warning"
                onClick={() => handleDealClick(restaurant.id)}
                sx={{
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                  '&:hover': {
                    backgroundColor: '#ff9800',
                    color: 'white'
                  }
                }}
              />
            </Box>
          )}
        </CardContent>
      </Card>
      
      {/* Deal Dialog */}
      <DealDialog
        open={dealDialogOpen}
        onClose={() => {
          setDealDialogOpen(false);
          setSelectedDeal(null);
        }}
        dealId={selectedDeal}
      />
    </>
  );
};

// Add prop types for better development experience
RestaurantCard.defaultProps = {
  restaurant: {
    id: 0,
    name: "Restaurant Name",
    image: "",
    rating: 0,
    location: "",
    delivery_time: "30-45",
    delivery_fee: 40,
    min_order_amount: 0,
    is_open: true,
    has_menu: true,
    cuisine_name: "",
    description: "",
    menu_item_count: 0,
    deal_count: 0
  },
  isFavorite: false,
  onFavoriteToggle: () => {},
  onDealClick: () => {}
};