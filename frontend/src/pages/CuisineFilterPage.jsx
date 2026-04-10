import API_BASE_URL from '../config/api'
import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Alert,
  Button,
  Grid,
  Chip,
  Breadcrumbs,
  Link as MuiLink,
  Container,
  CardMedia,
  Stack
} from "@mui/material";
import { 
  ArrowBack, 
  Home, 
  Restaurant, 
  Star,
  Timer,
  LocalOffer
} from "@mui/icons-material";
import { RestaurantCard } from "../components/RestaurantCard";

// API function to fetch cuisine data
const fetchCuisineData = async (cuisineSlug) => {
  if (!cuisineSlug) {
    throw new Error("No cuisine specified");
  }

  const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/cuisines/${cuisineSlug}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Cuisine "${cuisineSlug}" not found`);
    }
    throw new Error(`Failed to load data: ${response.status}`);
  }
  
  const data = await response.json();
  
  // If API returns error property
  if (data.error) {
    throw new Error(data.error);
  }
  
  return data;
};

export default function CuisineFilterPage() {
  const { cuisine: cuisineSlug } = useParams();
  const navigate = useNavigate();

  // Use React Query for data fetching
  const { 
    data: cuisineData, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery({
    queryKey: ["cuisine", cuisineSlug],
    queryFn: () => fetchCuisineData(cuisineSlug),
    enabled: !!cuisineSlug,
    retry: 2,
    refetchOnWindowFocus: false
  });

  // Handle navigation
  const handleGoBack = () => navigate(-1);
  const handleGoToCuisines = () => navigate('/cuisines');
  const handleGoHome = () => navigate('/');

  // Extract data from response
  const cuisine = cuisineData?.cuisine || null;
  const restaurants = cuisineData?.restaurants || [];
  const cuisineName = cuisine?.name || (cuisineSlug ? cuisineSlug.replace(/-/g, ' ') : 'Cuisine');

  // Loading state
  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 12, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 3, color: "text.secondary" }}>
          Discovering {cuisineName} restaurants...
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, color: "text.disabled" }}>
          Loading delicious options for you
        </Typography>
      </Container>
    );
  }

  // Error state
  if (isError) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert 
          severity="error"
          sx={{ mb: 4, borderRadius: 2 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => refetch()}
              sx={{ textTransform: 'none' }}
            >
              Try Again
            </Button>
          }
        >
          <Typography fontWeight="bold">
            Oops! Something went wrong
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {error?.message || "Failed to load cuisine data"}
          </Typography>
        </Alert>

        <Box sx={{ 
          backgroundColor: 'grey.50', 
          p: 4, 
          borderRadius: 2,
          mb: 4 
        }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
            Troubleshooting Tips
          </Typography>
          <Box component="ul" sx={{ pl: 2, color: 'text.secondary' }}>
            <li>Make sure the backend server is running on ${import.meta.env.VITE_API_URL || "http://localhost:4000"}</li>
            <li>Check if the cuisine "{cuisineSlug}" exists</li>
            <li>Verify your internet connection</li>
          </Box>
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={handleGoBack}
              fullWidth={{ xs: true, sm: false }}
            >
              Go Back
            </Button>
            <Button
              variant="contained"
              onClick={handleGoToCuisines}
              fullWidth={{ xs: true, sm: false }}
            >
              Browse All Cuisines
            </Button>
            <Button
              variant="text"
              onClick={handleGoHome}
              fullWidth={{ xs: true, sm: false }}
            >
              Go Home
            </Button>
          </Stack>
        </Box>

        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Quick Links:
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
            <Button 
              size="small" 
              variant="text" 
              onClick={() => window.open(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/health', '_blank')}
            >
              Health Check
            </Button>
            <Button 
              size="small" 
              variant="text" 
              onClick={() => window.open(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/cuisines', '_blank')}
            >
              All Cuisines
            </Button>
            <Button 
              size="small" 
              variant="text" 
              onClick={() => window.open(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/restaurants', '_blank')}
            >
              All Restaurants
            </Button>
          </Stack>
        </Box>
      </Container>
    );
  }

  // No cuisine found
  if (!cuisine) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <Restaurant sx={{ fontSize: 80, color: 'text.disabled', mb: 3, opacity: 0.5 }} />
        <Typography variant="h4" color="text.secondary" gutterBottom>
          Cuisine Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
          We couldn't find "{cuisineName}" in our database. It might have been removed or the URL is incorrect.
        </Typography>
        <Button
          variant="contained"
          onClick={handleGoToCuisines}
          size="large"
          sx={{ borderRadius: 2 }}
        >
          Explore Available Cuisines
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Breadcrumbs Navigation */}
      <Breadcrumbs sx={{ mb: 4 }}>
        <MuiLink
          component="button"
          underline="hover"
          color="inherit"
          onClick={handleGoHome}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <Home sx={{ mr: 0.5, fontSize: 20 }} />
          Home
        </MuiLink>
        <MuiLink
          component="button"
          underline="hover"
          color="inherit"
          onClick={handleGoToCuisines}
        >
          Cuisines
        </MuiLink>
        <Typography color="text.primary" fontWeight="medium">
          {cuisine.name}
        </Typography>
      </Breadcrumbs>

      {/* Back Button */}
      <Button
        startIcon={<ArrowBack />}
        onClick={handleGoToCuisines}
        sx={{ mb: 4 }}
        variant="outlined"
      >
        All Cuisines
      </Button>

      {/* Cuisine Header Section */}
      <Box sx={{ mb: 6 }}>
        <Grid container spacing={4} alignItems="center">
          {/* Cuisine Image */}
          <Grid item xs={12} md={5}>
            <CardMedia
              component="img"
              image={cuisine.image || `https://source.unsplash.com/random/600x400/?${cuisine.name},food`}
              alt={cuisine.name}
              sx={{
                width: '100%',
                height: { xs: 250, md: 350 },
                objectFit: 'cover',
                borderRadius: 3,
                boxShadow: 4,
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.02)'
                }
              }}
              onError={(e) => {
                e.target.src = `https://source.unsplash.com/random/600x400/?${cuisine.name},cuisine`;
              }}
            />
          </Grid>
          
          {/* Cuisine Info */}
          <Grid item xs={12} md={7}>
            <Typography variant="h2" fontWeight="bold" gutterBottom sx={{ color: 'primary.main' }}>
              {cuisine.name}
            </Typography>
            
            {cuisine.description && (
              <Typography variant="h6" color="text.secondary" paragraph sx={{ mb: 3, lineHeight: 1.6 }}>
                {cuisine.description}
              </Typography>
            )}
            
            {/* Stats Chips */}
            <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mt: 3 }}>
              <Chip
                icon={<Restaurant />}
                label={`${restaurants.length} Restaurants`}
                color="primary"
                variant="outlined"
                sx={{ mb: 1 }}
              />
              
              {cuisine.is_featured && (
                <Chip
                  icon={<Star />}
                  label="Featured Cuisine"
                  color="warning"
                  sx={{ mb: 1 }}
                />
              )}
              
              <Chip
                icon={<Timer />}
                label="30-45 Min Delivery"
                color="success"
                variant="outlined"
                sx={{ mb: 1 }}
              />
              
              <Chip
                icon={<LocalOffer />}
                label="Multiple Options"
                color="info"
                variant="outlined"
                sx={{ mb: 1 }}
              />
            </Stack>
            
            {/* Quick Actions */}
            <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => {
                  if (restaurants.length > 0) {
                    const firstRestaurant = restaurants[0];
                    navigate(`/restaurants/${firstRestaurant.id}`);
                  }
                }}
                disabled={restaurants.length === 0}
                sx={{ borderRadius: 2 }}
              >
                Order Now
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                onClick={() => {
                  if (restaurants.length > 0) {
                    navigate(`/restaurants/${restaurants[0].id}`);
                  }
                }}
                disabled={restaurants.length === 0}
                sx={{ borderRadius: 2 }}
              >
                View Menu
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Restaurants Section */}
      <Box sx={{ mb: 8 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              {cuisine.name} Restaurants
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Discover the best {cuisine.name.toLowerCase()} restaurants near you
            </Typography>
          </Box>
          
          <Chip
            label={`${restaurants.length} Available`}
            color="primary"
            size="medium"
          />
        </Box>

        {/* Restaurants Grid */}
        {restaurants.length > 0 ? (
          <Grid container spacing={4}>
            {restaurants.map((restaurant) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={restaurant.id}>
                <RestaurantCard
                  restaurant={restaurant}
                  showCuisine={false} // Don't show cuisine since we're on cuisine page
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          // No restaurants state
          <Box sx={{ 
            textAlign: 'center', 
            py: 10, 
            border: '2px dashed', 
            borderColor: 'divider', 
            borderRadius: 3,
            backgroundColor: 'grey.50'
          }}>
            <Restaurant sx={{ fontSize: 80, color: 'text.disabled', mb: 3, opacity: 0.5 }} />
            <Typography variant="h5" color="text.secondary" gutterBottom fontWeight="medium">
              No restaurants available yet
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 500, mx: 'auto', mb: 4 }}>
              There are currently no restaurants serving {cuisine.name} cuisine. Check back soon or explore other cuisines.
            </Typography>
            <Button
              variant="contained"
              onClick={handleGoToCuisines}
              size="large"
              sx={{ borderRadius: 2 }}
            >
              Explore Other Cuisines
            </Button>
          </Box>
        )}
      </Box>

      {/* Bottom Navigation & Info */}
      {restaurants.length > 0 && (
        <Box sx={{ 
          mt: 8, 
          pt: 4, 
          borderTop: 1, 
          borderColor: 'divider',
          backgroundColor: 'grey.50',
          borderRadius: 3,
          p: 4
        }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                About {cuisine.name} Cuisine
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {cuisine.description || `Experience authentic ${cuisine.name} cuisine with our carefully selected restaurants. Each restaurant has been verified for quality, authenticity, and customer satisfaction.`}
              </Typography>
              <Button
                variant="text"
                onClick={() => window.open(`https://en.wikipedia.org/wiki/${cuisine.name}_cuisine`, '_blank')}
                sx={{ mt: 2, textTransform: 'none' }}
              >
                Learn more about {cuisine.name} cuisine â†’
              </Button>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Need Help?
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Can't find what you're looking for? Contact our support team for assistance.
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/contact')}
                  sx={{ textTransform: 'none' }}
                >
                  Contact Support
                </Button>
                <Button
                  variant="contained"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  sx={{ textTransform: 'none' }}
                >
                  Back to Top
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Footer Note */}
      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Showing {restaurants.length} of {cuisine.restaurant_count || restaurants.length} {cuisine.name} restaurants
        </Typography>
      </Box>
    </Container>
  );
}


