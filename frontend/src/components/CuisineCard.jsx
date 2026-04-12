  // src/components/CuisineCard.jsx
import { useFavoritesStore } from "../store/FavoritesStore";
import { Card, CardMedia, CardContent, Typography, IconButton } from "@mui/material";
import { Favorite, FavoriteBorder } from "@mui/icons-material";
import { Link } from "react-router-dom";

export const CuisineCard = ({ cuisine, isActive, onClick }) => {
  const { addFavorite, removeFavorite, favorites } = useFavoritesStore();
  
  const isFavorite = favorites.some(fav => fav.id === cuisine.id && fav.type === 'cuisine');

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (isFavorite) {
      removeFavorite(cuisine.id, 'cuisine');
    } else {
      addFavorite(cuisine, 'cuisine');
    }
  };

  const slug = cuisine.name?.toLowerCase().replace(/\s+/g, "-") || `cuisine-${cuisine.id}`;

  return (
    <Card
      component={Link}
      to={`/cuisines/${slug}`}
      sx={{
        minWidth: 160,
        maxWidth: 160,
        cursor: 'pointer',
        border: isActive ? '2px solid #1976d2' : '1px solid #e0e0e0',
        position: 'relative',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      {/* Cuisine Image */}
      <CardMedia
        component="img"
        image={cuisine.image || "/images/cuisine-placeholder.jpg"}
        alt={cuisine.name}
        sx={{ 
          height: 120,
          objectFit: 'cover'
        }}
        onError={(e) => {
          e.target.src = "/images/cuisine-placeholder.jpg";
        }}
      />

      <CardContent sx={{ p: 2 }}>
        {/* Cuisine Name */}
        <Typography 
          variant="subtitle1" 
          fontWeight="bold"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            mb: 0.5,
          }}
        >
          {cuisine.name}
        </Typography>

        {/* Restaurant count if available */}
        {cuisine.restaurant_count !== undefined && (
          <Typography variant="caption" color="text.secondary">
            {cuisine.restaurant_count} restaurants
          </Typography>
        )}

        {/* Favorite Button */}
        <IconButton
          onClick={handleFavoriteClick}
          size="small"
          sx={{ 
            position: 'absolute', 
            top: 8, 
            right: 8,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
            }
          }}
        >
          {isFavorite ? (
            <Favorite color="error" fontSize="small" />
          ) : (
            <FavoriteBorder fontSize="small" />
          )}
        </IconButton>
      </CardContent>
    </Card>
  );
};


