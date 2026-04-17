import API_BASE_URL from '../../shared/config/api';
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useFavorites } from '../../favorites/store/FavoritesContext';
import DealDialog from '../../deals/components/DealDialog';
import {
  Box,
  Container,
  TextField,
  InputAdornment,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Stack,
  Button,
  IconButton,
  Divider,
  Skeleton,
  Paper,
  Badge,
  Checkbox,
  Alert,
} from "@mui/material";
import {
  Search,
  Clear,
  Favorite,
  FavoriteBorder,
  LocationOn,
  AccessTime,
  Restaurant,
  ErrorOutline,
  Refresh,
  LocalOffer,
} from "@mui/icons-material";

// API Configuration
const RESTAURANTS_ENDPOINT = `${API_BASE_URL}/restaurants`;

// Helper function to ensure image URL is absolute
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  if (imagePath.startsWith("/")) {
    return `${API_BASE_URL}${imagePath}`;
  }
  return `${API_BASE_URL}/${imagePath}`;
};

// Default restaurant image
const DEFAULT_RESTAURANT_IMAGE =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60";

export default function RestaurantPage() {
  const navigate = useNavigate();
  const favoritesContext = useFavorites();

  const addToFavorites = favoritesContext?.addToFavorites;
  const isFavorite = favoritesContext?.isFavorite;

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCuisine, setFilteredCuisine] = useState("");
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [dealDialogOpen, setDealDialogOpen] = useState(false);

  const fetchRestaurants = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(RESTAURANTS_ENDPOINT, {
        timeout: 10000,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      console.log("API Response:", response.data);

      let restaurantsData = [];

      if (response.data) {
        if (response.data.items && Array.isArray(response.data.items)) {
          restaurantsData = response.data.items;
        } else if (Array.isArray(response.data)) {
          restaurantsData = response.data;
        } else if (
          response.data.restaurants &&
          Array.isArray(response.data.restaurants)
        ) {
          restaurantsData = response.data.restaurants;
        }
      }

      const transformedRestaurants = restaurantsData.map(
        (restaurant, index) => {
          const hasMenu = true;
          const menuUpdating = false;

          const imageUrl = restaurant.image || restaurant.image_url || null;

          let rating = 4.0 + Math.random() * 1.0;
          if (restaurant.rating !== undefined && restaurant.rating !== null) {
            if (typeof restaurant.rating === "string") {
              rating = parseFloat(restaurant.rating) || rating;
            } else if (typeof restaurant.rating === "number") {
              rating = restaurant.rating;
            }
          }

          const dealCount =
            restaurant.deal_count || Math.floor(Math.random() * 5);

          return {
            id: restaurant.id || restaurant._id || `restaurant-${index + 1}`,
            name:
              restaurant.name ||
              restaurant.restaurantName ||
              `Restaurant ${index + 1}`,
            cuisine:
              restaurant.cuisine_name ||
              restaurant.cuisine ||
              restaurant.category ||
              "Fast Food",
            location:
              restaurant.location ||
              restaurant.address ||
              restaurant.city ||
              "456 Fast Lane, Snack Town",
            delivery_time:
              restaurant.delivery_time || restaurant.deliveryTime || "30-45",
            delivery_fee:
              restaurant.delivery_fee || restaurant.deliveryFee || 2.99,
            is_open: restaurant.is_open !== false,
            has_menu: hasMenu,
            menu_updating: menuUpdating,
            menu_available: true,
            menu_item_count: restaurant.menu_item_count || 0,
            deal_count: dealCount,
            image: getImageUrl(imageUrl),
            image_url: getImageUrl(imageUrl),
            rating: rating,
          };
        },
      );

      console.log("Transformed restaurants:", transformedRestaurants);
      console.log(
        "Restaurants with deals:",
        transformedRestaurants
          .filter((r) => r.deal_count > 0)
          .map((r) => ({
            name: r.name,
            deal_count: r.deal_count,
          })),
      );

      setRestaurants(transformedRestaurants);
    } catch (err) {
      console.error("Failed to fetch restaurants:", err.message);
      setError(
        "Unable to load restaurants. Please check if the backend server is running.",
      );
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const cuisines = useMemo(() => {
    const cuisineSet = new Set();
    restaurants.forEach((restaurant) => {
      if (restaurant.cuisine && restaurant.cuisine.trim()) {
        cuisineSet.add(restaurant.cuisine.trim());
      }
    });
    return Array.from(cuisineSet).sort();
  }, [restaurants]);

  const filteredRestaurants = useMemo(() => {
    if (!Array.isArray(restaurants) || restaurants.length === 0) {
      return [];
    }

    let filtered = restaurants;

    if (filteredCuisine) {
      filtered = filtered.filter((restaurant) =>
        restaurant.cuisine
          ?.toLowerCase()
          .includes(filteredCuisine.toLowerCase()),
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((restaurant) => {
        const nameMatch = restaurant.name?.toLowerCase().includes(query);
        const cuisineMatch = restaurant.cuisine?.toLowerCase().includes(query);
        const locationMatch = restaurant.location
          ?.toLowerCase()
          .includes(query);

        return nameMatch || cuisineMatch || locationMatch;
      });
    }

    return filtered;
  }, [restaurants, searchQuery, filteredCuisine]);

  const handleFavoriteToggle = useCallback(
    (restaurant) => {
      if (addToFavorites && typeof addToFavorites === "function") {
        try {
          addToFavorites({
            id: restaurant.id,
            name: restaurant.name,
            type: "restaurant",
            data: restaurant,
          });
        } catch (error) {
          console.error("Error adding to favorites:", error);
        }
      } else {
        console.warn("addToFavorites function not available");
      }
    },
    [addToFavorites],
  );

  const checkIsFavorite = useCallback(
    (restaurantId) => {
      if (isFavorite && typeof isFavorite === "function") {
        return isFavorite(restaurantId);
      }
      return false;
    },
    [isFavorite],
  );

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setFilteredCuisine("");
  }, []);

  const handleViewRestaurant = useCallback(
    (restaurantId) => {
      navigate(`/restaurants/${restaurantId}`);
    },
    [navigate],
  );

  const handleDealClick = useCallback((dealId) => {
    setSelectedDeal(dealId);
    setDealDialogOpen(true);
  }, []);

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5", py: 4 }}>
        <Container maxWidth="lg">
          <Skeleton variant="text" width={200} height={60} sx={{ mb: 4 }} />
          <Skeleton
            variant="rectangular"
            height={56}
            sx={{ mb: 3, borderRadius: 2 }}
          />

          <Grid container spacing={3}>
            {[1, 2].map((i) => (
              <Grid item xs={12} key={i}>
                <Card sx={{ borderRadius: 2 }}>
                  <Skeleton
                    variant="rectangular"
                    height={180}
                    sx={{ width: "100%" }}
                  />
                  <CardContent sx={{ p: 3 }}>
                    <Skeleton variant="text" height={40} sx={{ mb: 2 }} />
                    <Skeleton
                      variant="text"
                      width="40%"
                      height={30}
                      sx={{ mb: 2 }}
                    />
                    <Skeleton
                      variant="text"
                      width="60%"
                      height={20}
                      sx={{ mb: 1 }}
                    />
                    <Skeleton
                      variant="text"
                      width="50%"
                      height={20}
                      sx={{ mb: 1 }}
                    />
                    <Skeleton
                      variant="text"
                      width="40%"
                      height={20}
                      sx={{ mb: 3 }}
                    />
                    <Box display="flex" gap={2}>
                      <Skeleton
                        variant="rectangular"
                        width="50%"
                        height={40}
                        sx={{ borderRadius: 1 }}
                      />
                      <Skeleton
                        variant="rectangular"
                        width="50%"
                        height={40}
                        sx={{ borderRadius: 1 }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#f5f5f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        <Container maxWidth="sm">
          <Paper
            sx={{ p: 4, textAlign: "center", borderRadius: 2, boxShadow: 1 }}
          >
            <ErrorOutline
              sx={{ fontSize: 60, color: "#d70f64", mb: 3, opacity: 0.8 }}
            />
            <Typography
              variant="h5"
              gutterBottom
              color="#d70f64"
              sx={{ fontWeight: "bold", mb: 2 }}
            >
              Connection Error
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              paragraph
              sx={{ mb: 3 }}
            >
              {error}
            </Typography>

            <Button
              variant="contained"
              onClick={fetchRestaurants}
              startIcon={<Refresh />}
              sx={{
                bgcolor: "#d70f64",
                "&:hover": { bgcolor: "#b80d55" },
                px: 4,
                py: 1.5,
              }}
            >
              Retry Connection
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f5f5f5",
        pb: 12,
      }}
    >
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontWeight: "bold",
              color: "#d70f64",
              mb: 3,
              textAlign: "center",
            }}
          >
            FoodieApp
          </Typography>

          <Paper
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 2,
              boxShadow: 1,
              bgcolor: "white",
            }}
          >
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search restaurants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: "#d70f64" }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setSearchQuery("")}
                      size="small"
                      edge="end"
                      sx={{ color: "#666" }}
                    >
                      <Clear />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1,
                  "&:hover fieldset": {
                    borderColor: "#d70f64",
                  },
                },
              }}
            />
          </Paper>

          {restaurants.length > 0 && cuisines.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Filter by Cuisine:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  label="All"
                  onClick={() => setFilteredCuisine("")}
                  variant={!filteredCuisine ? "filled" : "outlined"}
                  sx={{
                    bgcolor: !filteredCuisine ? "#d70f64" : "transparent",
                    color: !filteredCuisine ? "white" : "#666",
                    borderColor: "#d70f64",
                    "&:hover": {
                      bgcolor: !filteredCuisine ? "#b80d55" : "#f0f0f0",
                    },
                  }}
                />
                {cuisines.map((cuisine) => (
                  <Chip
                    key={cuisine}
                    label={cuisine}
                    onClick={() => setFilteredCuisine(cuisine)}
                    variant={
                      filteredCuisine === cuisine ? "filled" : "outlined"
                    }
                    sx={{
                      bgcolor:
                        filteredCuisine === cuisine ? "#d70f64" : "transparent",
                      color: filteredCuisine === cuisine ? "white" : "#666",
                      borderColor: "#d70f64",
                      "&:hover": {
                        bgcolor:
                          filteredCuisine === cuisine ? "#b80d55" : "#f0f0f0",
                      },
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </Box>

        {process.env.NODE_ENV === "development" && restaurants.length > 0 && (
          <Alert severity="info" sx={{ mb: 3, fontSize: "0.8rem" }}>
            Debug: Showing {restaurants.length} restaurants. Available:{" "}
            {restaurants.filter((r) => r.menu_available).length} | Updating:{" "}
            {restaurants.filter((r) => r.menu_updating).length} | Deals:{" "}
            {restaurants.filter((r) => r.deal_count > 0).length}
          </Alert>
        )}

        {restaurants.length > 0 ? (
          filteredRestaurants.length > 0 ? (
            <Grid container spacing={3}>
              {filteredRestaurants.map((restaurant) => (
                <Grid item xs={12} key={restaurant.id}>
                  <RestaurantCard
                    restaurant={restaurant}
                    onFavoriteToggle={() => handleFavoriteToggle(restaurant)}
                    isFavorite={checkIsFavorite(restaurant.id)}
                    onViewMenu={() => handleViewRestaurant(restaurant.id)}
                    onDealClick={handleDealClick}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper sx={{ p: 6, textAlign: "center", borderRadius: 2 }}>
              <Search
                sx={{ fontSize: 60, color: "#d70f64", mb: 3, opacity: 0.5 }}
              />
              <Typography variant="h6" gutterBottom color="#d70f64">
                No matching restaurants
              </Typography>
              <Button
                variant="outlined"
                onClick={clearFilters}
                startIcon={<Clear />}
                sx={{
                  borderColor: "#d70f64",
                  color: "#d70f64",
                  "&:hover": {
                    borderColor: "#b80d55",
                    bgcolor: "rgba(215, 15, 100, 0.04)",
                  },
                }}
              >
                Clear Filters
              </Button>
            </Paper>
          )
        ) : (
          <EmptyState fetchRestaurants={fetchRestaurants} />
        )}
      </Container>

      <DealDialog
        open={dealDialogOpen}
        onClose={() => {
          setDealDialogOpen(false);
          setSelectedDeal(null);
        }}
        dealId={selectedDeal}
      />
    </Box>
  );
}

function RestaurantCard({
  restaurant,
  onFavoriteToggle,
  isFavorite,
  onViewMenu,
  onDealClick,
}) {
  const menuAvailable = true;

  const rating =
    typeof restaurant.rating === "number"
      ? restaurant.rating
      : typeof restaurant.rating === "string"
        ? parseFloat(restaurant.rating) || 0
        : 0;
  const formattedRating = rating > 0 ? rating.toFixed(1) : "0.0";

  console.log(`Restaurant: ${restaurant.name}`, {
    menu_available: menuAvailable,
    menu_item_count: restaurant.menu_item_count,
    deal_count: restaurant.deal_count,
    image: restaurant.image,
    image_url: restaurant.image_url,
    original_rating: restaurant.rating,
    parsed_rating: rating,
    formatted_rating: formattedRating,
  });

  return (
    <Card
      sx={{
        mb: 3,
        overflow: "hidden",
        borderRadius: 2,
        boxShadow: 2,
        position: "relative",
        bgcolor: "white",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: 4,
        },
      }}
    >
      <CardMedia
        component="img"
        height="180"
        image={
          restaurant.image || restaurant.image_url || DEFAULT_RESTAURANT_IMAGE
        }
        alt={restaurant.name}
        sx={{
          objectFit: "cover",
          width: "100%",
          backgroundColor: "#f5f5f5",
        }}
      />

      {restaurant.menu_item_count > 0 && (
        <Badge
          badgeContent={`${restaurant.menu_item_count} items`}
          color="success"
          sx={{
            position: "absolute",
            top: 12,
            left: 12,
            zIndex: 2,
            "& .MuiBadge-badge": {
              px: 2,
              py: 0.5,
              borderRadius: "12px",
              fontWeight: "bold",
              fontSize: "0.7rem",
              bgcolor: "#4caf50",
              color: "white",
            },
          }}
        />
      )}

      {rating > 0 && (
        <Box
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            bgcolor: "rgba(0, 0, 0, 0.7)",
            color: "white",
            px: 1.5,
            py: 0.5,
            borderRadius: "12px",
            fontWeight: "bold",
            fontSize: "0.8rem",
          }}
        >
          ★ {formattedRating}
        </Box>
      )}

      {restaurant.deal_count > 0 && (
        <Badge
          badgeContent={`${restaurant.deal_count} deals`}
          color="warning"
          sx={{
            position: "absolute",
            top: 12,
            left: restaurant.menu_item_count > 0 ? 140 : 12,
            zIndex: 2,
            "& .MuiBadge-badge": {
              px: 2,
              py: 0.5,
              borderRadius: "12px",
              fontWeight: "bold",
              fontSize: "0.7rem",
              bgcolor: "#ff9800",
              color: "white",
            },
          }}
        />
      )}

      <CardContent sx={{ p: 3 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={2}
        >
          <Typography variant="h6" fontWeight="bold" color="#d70f64">
            {restaurant.name}
          </Typography>
          <IconButton
            onClick={onFavoriteToggle}
            size="small"
            sx={{
              color: isFavorite ? "#d70f64" : "#999",
              "&:hover": {
                bgcolor: "rgba(215, 15, 100, 0.08)",
                color: "#d70f64",
              },
            }}
          >
            {isFavorite ? <Favorite /> : <FavoriteBorder />}
          </IconButton>
        </Box>

        <Typography
          variant="subtitle1"
          fontWeight="bold"
          color="text.primary"
          mb={2}
        >
          {restaurant.cuisine}
        </Typography>

        <Box display="flex" alignItems="center" mb={2}>
          <Checkbox
            checked={restaurant.is_open}
            size="small"
            disabled
            sx={{
              color: restaurant.is_open ? "#4caf50" : "#999",
              "&.Mui-checked": {
                color: "#4caf50",
              },
              p: 0,
              mr: 1,
            }}
          />
          <Typography
            variant="body2"
            color={restaurant.is_open ? "#4caf50" : "#999"}
          >
            Open Now
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" mb={1}>
          <LocationOn sx={{ fontSize: 16, color: "#666", mr: 1 }} />
          <Typography variant="body2" color="#666">
            {restaurant.location}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" mb={1}>
          <AccessTime sx={{ fontSize: 16, color: "#666", mr: 1 }} />
          <Typography variant="body2" color="#666">
            {restaurant.delivery_time} min
          </Typography>
        </Box>

        <Typography variant="body2" color="#666" mb={3}>
          Delivery: Rs. {restaurant.delivery_fee}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            fullWidth
            onClick={onViewMenu}
            sx={{
              borderColor: "#d70f64",
              color: "#d70f64",
              borderRadius: 1,
              textTransform: "uppercase",
              fontWeight: "bold",
              py: 1.2,
              fontSize: "0.85rem",
              letterSpacing: "0.5px",
              "&:hover": {
                borderColor: "#b80d55",
                bgcolor: "rgba(215, 15, 100, 0.04)",
              },
            }}
          >
            View Menu
          </Button>

          {restaurant.deal_count > 0 ? (
            <Button
              variant="contained"
              fullWidth
              onClick={() => onDealClick && onDealClick(restaurant.id)}
              startIcon={<LocalOffer />}
              sx={{
                bgcolor: "#ff9800",
                color: "white",
                borderRadius: 1,
                textTransform: "uppercase",
                fontWeight: "bold",
                py: 1.2,
                fontSize: "0.85rem",
                letterSpacing: "0.5px",
                "&:hover": {
                  bgcolor: "#e68900",
                },
              }}
            >
              View Deals
            </Button>
          ) : (
            <Button
              variant="contained"
              fullWidth
              onClick={onViewMenu}
              sx={{
                bgcolor: "#d70f64",
                color: "white",
                borderRadius: 1,
                textTransform: "uppercase",
                fontWeight: "bold",
                py: 1.2,
                fontSize: "0.85rem",
                letterSpacing: "0.5px",
                "&:hover": {
                  bgcolor: "#b80d55",
                },
              }}
            >
              Order Now
            </Button>
          )}
        </Box>

        {restaurant.deal_count > 0 && (
          <Box display="flex" justifyContent="center" mt={2}>
            <Chip
              icon={<LocalOffer />}
              label={`${restaurant.deal_count} Special Deals Available`}
              size="small"
              color="warning"
              variant="outlined"
              onClick={() => onDealClick && onDealClick(restaurant.id)}
              sx={{
                cursor: "pointer",
                fontWeight: "medium",
                fontSize: "0.75rem",
                "&:hover": {
                  backgroundColor: "#ff9800",
                  color: "white",
                },
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ fetchRestaurants }) {
  return (
    <Paper
      sx={{
        p: 6,
        textAlign: "center",
        borderRadius: 2,
        maxWidth: 500,
        mx: "auto",
      }}
    >
      <Restaurant
        sx={{ fontSize: 80, color: "#d70f64", mb: 3, opacity: 0.7 }}
      />
      <Typography
        variant="h5"
        gutterBottom
        color="#d70f64"
        sx={{ fontWeight: "bold", mb: 2 }}
      >
        No Restaurants Found
      </Typography>
      <Button
        variant="contained"
        onClick={fetchRestaurants}
        startIcon={<Refresh />}
        sx={{
          bgcolor: "#d70f64",
          "&:hover": { bgcolor: "#b80d55" },
          px: 4,
          py: 1.5,
        }}
      >
        Retry Connection
      </Button>
    </Paper>
  );
}