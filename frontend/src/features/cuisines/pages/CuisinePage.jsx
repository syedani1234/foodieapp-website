import { useCuisineData } from '../hooks/useCuisineData';
import { useNavigate } from "react-router-dom";
import { 
  Box, 
  Grid, 
  Typography, 
  CircularProgress, 
  Alert,
  Card,
  CardContent,
  CardMedia,
  Container,
  Button,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Stack,
  Paper,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
  Divider
} from "@mui/material";
import { 
  Refresh, 
  Restaurant, 
  ArrowForward, 
  Favorite, 
  FavoriteBorder, 
  Search,
  TrendingUp,
  Star,
  StarBorder,
  LocalDining,
  GridView,
  ViewList,
  LocationOn,
  Phone,
  Email,
  Facebook,
  Twitter,
  Instagram,
  LinkedIn,
  LocalOffer,
  Shield,
  HeadsetMic
} from "@mui/icons-material";
import { useFavoritesStore } from '../../favorites/store/FavoritesStore';
import { useState, useMemo } from "react";

// Helper function to create cuisine slug
const createSlug = (name) => {
  if (!name) return '';
  return name.toLowerCase().replace(/\s+/g, '-');
};

export const CuisinesPage = () => {
  const { 
    data: cuisines = [], 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useCuisineData();

  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const navigate = useNavigate();
  
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
  const [sortBy, setSortBy] = useState("name"); // "name", "popularity", "restaurants"
  const [filterFeatured, setFilterFeatured] = useState(false);

  // Filter and sort cuisines
  const filteredCuisines = useMemo(() => {
    let result = [...cuisines];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(cuisine => 
        cuisine.name?.toLowerCase().includes(query) ||
        cuisine.description?.toLowerCase().includes(query)
      );
    }

    // Apply featured filter
    if (filterFeatured) {
      result = result.filter(cuisine => cuisine.is_featured || cuisine.featured);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "restaurants":
          return (b.restaurant_count || 0) - (a.restaurant_count || 0);
        case "popularity":
          return (b.popularity || 0) - (a.popularity || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [cuisines, searchQuery, filterFeatured, sortBy]);

  // Handle cuisine click
  const handleCuisineClick = (cuisine) => {
    const slug = createSlug(cuisine.name);
    navigate(`/cuisines/${slug}`);
  };

  // Handle favorite toggle
  const handleFavoriteToggle = (cuisine, e) => {
    e.stopPropagation();
    toggleFavorite(cuisine.id, 'cuisine');
  };

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ minHeight: "70vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={80} thickness={4} />
        <Typography variant="h5" sx={{ mt: 4, mb: 2, color: "text.secondary" }}>
          Discovering Culinary Delights
        </Typography>
        <LinearProgress sx={{ width: 300, mt: 4, borderRadius: 1 }} />
      </Box>
    );
  }

  // Error state
  if (isError) {
    return (
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Alert 
          severity="error"
          sx={{ 
            mb: 5, 
            borderRadius: 3,
            boxShadow: 2
          }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => refetch()}
              startIcon={<Refresh />}
              variant="outlined"
            >
              Retry
            </Button>
          }
        >
          <Typography variant="h6" gutterBottom>
            Unable to Load Cuisines
          </Typography>
          <Typography variant="body2">
            {error?.message || "There was a problem connecting to the server."}
          </Typography>
        </Alert>
      </Container>
    );
  }

  // Empty state
  if (cuisines.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 12, textAlign: 'center' }}>
        <Box sx={{ 
          width: 120, 
          height: 120, 
          borderRadius: '50%', 
          bgcolor: 'primary.50', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          mx: 'auto',
          mb: 4
        }}>
          <LocalDining sx={{ fontSize: 60, color: 'primary.main', opacity: 0.7 }} />
        </Box>
        <Typography variant="h3" gutterBottom fontWeight="bold" color="text.primary">
          No Cuisines Available
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
          We're updating our cuisine list. Please check back soon!
        </Typography>
        
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button
            variant="contained"
            onClick={() => refetch()}
            startIcon={<Refresh />}
            size="large"
            sx={{ borderRadius: 2 }}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/')}
            size="large"
            sx={{ borderRadius: 2 }}
          >
            Return Home
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 6 }}>
      {/* Hero Section */}
      <Box sx={{ mb: 8, textAlign: 'center' }}>
        <Typography variant="h1" fontWeight="bold" gutterBottom sx={{ 
          fontSize: { xs: '2.5rem', md: '3.5rem' },
          color: 'primary.main'
        }}>
          Explore World Cuisines
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph sx={{ maxWidth: 800, mx: 'auto', mb: 4 }}>
          Discover restaurants serving authentic cuisines from around the world
        </Typography>
      </Box>

      {/* Search and Filters Section */}
      <Paper sx={{ p: 3, mb: 6, borderRadius: 2, boxShadow: 1 }}>
        <Grid container spacing={3} alignItems="center">
          {/* Search */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search cuisines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              size="medium"
            />
          </Grid>

          {/* Sort and Filter Controls */}
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={2} justifyContent={{ xs: 'flex-start', md: 'flex-end' }} flexWrap="wrap">
              <ToggleButtonGroup
                value={sortBy}
                exclusive
                onChange={(e, value) => value && setSortBy(value)}
                size="small"
              >
                <ToggleButton value="name">
                  Name
                </ToggleButton>
                <ToggleButton value="restaurants">
                  Restaurants
                </ToggleButton>
                <ToggleButton value="popularity">
                  Popular
                </ToggleButton>
              </ToggleButtonGroup>

              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, value) => value && setViewMode(value)}
                size="small"
              >
                <ToggleButton value="grid">
                  <GridView />
                </ToggleButton>
                <ToggleButton value="list">
                  <ViewList />
                </ToggleButton>
              </ToggleButtonGroup>

              <Chip
                icon={filterFeatured ? <Star /> : <StarBorder />}
                label="Featured"
                onClick={() => setFilterFeatured(!filterFeatured)}
                color={filterFeatured ? "warning" : "default"}
                variant={filterFeatured ? "filled" : "outlined"}
                clickable
              />
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Results Info */}
      {searchQuery && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Found {filteredCuisines.length} cuisines matching "{searchQuery}"
          <Button size="small" onClick={() => setSearchQuery("")} sx={{ ml: 1 }}>
            Clear
          </Button>
        </Typography>
      )}

      {/* Cuisines Grid/List */}
      {filteredCuisines.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 2 }}>
          <Search sx={{ fontSize: 80, color: 'text.disabled', mb: 3, opacity: 0.5 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No matching cuisines found
          </Typography>
          <Button
            variant="outlined"
            onClick={() => {
              setSearchQuery("");
              setFilterFeatured(false);
              setSortBy("name");
            }}
            sx={{ mt: 2 }}
          >
            Clear All Filters
          </Button>
        </Paper>
      ) : (
        <>
          {/* View Mode: Grid */}
          {viewMode === "grid" && (
            <Grid container spacing={3}>
              {filteredCuisines.map((cuisine) => {
                const isFav = isFavorite(cuisine.id, 'cuisine');
                const restaurantCount = cuisine.restaurant_count || 0;

                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={cuisine.id}>
                    <Card
                      sx={{
                        height: '100%',
                        cursor: 'pointer',
                        transition: 'transform 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden',
                        borderRadius: 2,
                        boxShadow: 1,
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 3,
                        }
                      }}
                      onClick={() => handleCuisineClick(cuisine)}
                    >
                      {/* Favorite Button */}
                      <IconButton
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          zIndex: 2,
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          '&:hover': {
                            backgroundColor: 'white',
                          }
                        }}
                        onClick={(e) => handleFavoriteToggle(cuisine, e)}
                        size="medium"
                      >
                        {isFav ? (
                          <Favorite sx={{ color: 'error.main' }} />
                        ) : (
                          <FavoriteBorder sx={{ color: 'text.secondary' }} />
                        )}
                      </IconButton>

                      {/* Cuisine Image */}
                      <Box sx={{ position: 'relative', height: 180, overflow: 'hidden' }}>
                        <CardMedia
                          component="img"
                          image={cuisine.image_url || cuisine.image || `https://source.unsplash.com/random/400x300/?${encodeURIComponent(cuisine.name || 'food')},cuisine`}
                          alt={cuisine.name}
                          sx={{
                            height: '100%',
                            width: '100%',
                            objectFit: 'cover',
                          }}
                          onError={(e) => {
                            e.target.src = `https://source.unsplash.com/random/400x300/?food,${encodeURIComponent(cuisine.name || 'cuisine')}`;
                          }}
                        />
                      </Box>

                      {/* Cuisine Info */}
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {cuisine.name}
                        </Typography>

                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{
                            mb: 2,
                            minHeight: 60,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {cuisine.description || `Explore authentic ${cuisine.name} cuisine`}
                        </Typography>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Chip
                            icon={<Restaurant />}
                            label={`${restaurantCount} Restaurants`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          
                          {(cuisine.is_featured || cuisine.featured) && (
                            <Chip
                              icon={<Star />}
                              label="Featured"
                              size="small"
                              color="warning"
                              variant="outlined"
                            />
                          )}
                        </Box>

                        <Button
                          fullWidth
                          variant="contained"
                          size="small"
                          endIcon={<ArrowForward />}
                          sx={{
                            borderRadius: 1,
                            textTransform: 'none',
                            fontWeight: 'bold',
                          }}
                        >
                          Explore Now
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}

          {/* View Mode: List */}
          {viewMode === "list" && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredCuisines.map((cuisine) => {
                const isFav = isFavorite(cuisine.id, 'cuisine');
                
                return (
                  <Paper 
                    key={cuisine.id}
                    sx={{ 
                      p: 2, 
                      borderRadius: 2, 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: 2,
                        bgcolor: 'action.hover'
                      }
                    }}
                    onClick={() => handleCuisineClick(cuisine)}
                  >
                    <Grid container alignItems="center" spacing={2}>
                      <Grid item xs={1}>
                        <IconButton onClick={(e) => handleFavoriteToggle(cuisine, e)} size="small">
                          {isFav ? <Favorite color="error" /> : <FavoriteBorder />}
                        </IconButton>
                      </Grid>
                      <Grid item xs={4} md={3}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {cuisine.name}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={5}>
                        <Typography variant="body2" color="text.secondary">
                          {cuisine.description || `Explore ${cuisine.name} restaurants`}
                        </Typography>
                      </Grid>
                      <Grid item xs={4} md={2}>
                        <Chip
                          icon={<Restaurant />}
                          label={`${cuisine.restaurant_count || 0} Restaurants`}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={4} md={1}>
                        <Button
                          variant="text"
                          size="small"
                          endIcon={<ArrowForward />}
                        >
                          View
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>
                );
              })}
            </Box>
          )}
        </>
      )}

      {/* Food Panda Style Footer */}
      <Box sx={{ mt: 8, pt: 6, pb: 4, bgcolor: 'grey.50' }}>
        <Container maxWidth="lg">
          {/* Main Footer Content */}
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                About Food Explorer
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Discover the best restaurants and cuisines in your area. Order food delivery or takeaway from thousands of top-rated restaurants.
              </Typography>
              <Stack direction="row" spacing={1}>
                <IconButton size="small" color="primary">
                  <Facebook />
                </IconButton>
                <IconButton size="small" color="primary">
                  <Twitter />
                </IconButton>
                <IconButton size="small" color="primary">
                  <Instagram />
                </IconButton>
                <IconButton size="small" color="primary">
                  <LinkedIn />
                </IconButton>
              </Stack>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Quick Links
              </Typography>
              <Stack spacing={1}>
                <Button 
                  variant="text" 
                  size="small" 
                  onClick={() => navigate('/')}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  Home
                </Button>
                <Button 
                  variant="text" 
                  size="small" 
                  onClick={() => navigate('/restaurants')}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  Restaurants
                </Button>
                <Button 
                  variant="text" 
                  size="small" 
                  onClick={() => navigate('/deals')}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  Deals & Offers
                </Button>
                <Button 
                  variant="text" 
                  size="small" 
                  onClick={() => navigate('/contact')}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  Contact Us
                </Button>
              </Stack>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Contact Info
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationOn sx={{ mr: 1, color: 'text.secondary' }} fontSize="small" />
                  <Typography variant="body2" color="text.secondary">
                    123 Food Street, City, Country
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Phone sx={{ mr: 1, color: 'text.secondary' }} fontSize="small" />
                  <Typography variant="body2" color="text.secondary">
                    +1 234 567 8900
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Email sx={{ mr: 1, color: 'text.secondary' }} fontSize="small" />
                  <Typography variant="body2" color="text.secondary">
                    support@foodexplorer.com
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* Trust & Safety Section */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="body2" fontWeight="medium">
                  100% Secure Payments
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LocalOffer sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body2" fontWeight="medium">
                  Best Price Guarantee
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HeadsetMic sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="body2" fontWeight="medium">
                  24/7 Customer Support
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Restaurant sx={{ mr: 1, color: 'error.main' }} />
                <Typography variant="body2" fontWeight="medium">
                  Verified Restaurants
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ mb: 3 }} />

          {/* Copyright */}
          <Box sx={{ textAlign: 'center', pt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} Food Explorer. All rights reserved.
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Privacy Policy
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Terms of Service
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Cookie Policy
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Sitemap
              </Typography>
            </Stack>
          </Box>
        </Container>
      </Box>
    </Container>
  );
};