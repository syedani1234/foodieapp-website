import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Search, 
  LocalFireDepartment, 
  Restaurant, 
  FilterList, 
  ArrowForward,
  Whatshot,
  Discount
} from "@mui/icons-material";
import { 
  Button, 
  Chip, 
  InputAdornment, 
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Pagination,
  Badge,
  Grid,
  Box
} from "@mui/material";
import { DealCard } from '../../deals/components/DealCard';
import { CuisineCard } from '../../cuisines/components/CuisineCard';
import { RestaurantCard } from '../../restaurants/components/RestaurantCard';
import { useDealsData } from '../../deals/hooks/useDealsData';
import { useCuisineData } from '../../cuisines/hooks/useCuisineData';
import { useRestaurantsData } from '../../restaurants/hooks/useRestaurantData';
import { useFavoritesStore } from '../../favorites/store/FavoritesStore';

export const HomePage = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("");
  const [page, setPage] = useState(1);
  
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavoritesStore();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 450);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch data
  const { 
    data: deals, 
    isLoading: dealsLoading,
    error: dealsError 
  } = useDealsData();
  
  const { 
    data: cuisines,
    isLoading: cuisinesLoading 
  } = useCuisineData();
  
  const {
    data: restaurantsResponse,
    isLoading: restaurantsLoading,
    isError: restaurantsError,
  } = useRestaurantsData({
    search: debouncedSearch,
    cuisine: selectedCuisine,
    page,
    limit: 12,
  });

  const restaurants = restaurantsResponse?.items || [];
  const total = restaurantsResponse?.total || 0;
  const totalPages = Math.ceil(total / 12);

  // Filter deals with special offers
  const featuredDeals = useMemo(() => {
    if (!deals) return [];
    return deals.filter(deal => {
      const discountPercent = deal.discount_percent || 
        (deal.original_price && deal.discount_price ? 
          ((deal.original_price - deal.discount_price) / deal.original_price) * 100 : 0);
      return discountPercent >= 30;
    }).slice(0, 6);
  }, [deals]);

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setDebouncedSearch(search);
    setPage(1);
  };

  // Navigate to restaurant details page
  const handleRestaurantClick = (restaurantId) => {
    navigate(`/restaurants/${restaurantId}`);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearch("");
    setSelectedCuisine("");
    setPage(1);
  };

  // View all deals
  const handleViewAllDeals = () => {
    navigate("/deals");
  };

  // View all restaurants
  const handleViewAllRestaurants = () => {
    navigate("/restaurants");
  };

  // Deal Statistics
  const dealStats = useMemo(() => {
    if (!deals || deals.length === 0) {
      return { avgDiscount: 0, totalDeals: 0, maxDiscount: 0 };
    }
    
    const totalDeals = deals.length;
    const totalDiscount = deals.reduce((sum, deal) => {
      const discount = deal.discount_percent || 
        (deal.original_price && deal.discount_price ? 
          ((deal.original_price - deal.discount_price) / deal.original_price) * 100 : 0);
      return sum + discount;
    }, 0);
    
    const maxDiscount = Math.max(...deals.map(deal => 
      deal.discount_percent || 
      (deal.original_price && deal.discount_price ? 
        ((deal.original_price - deal.discount_price) / deal.original_price) * 100 : 0)
    ));
    
    return {
      avgDiscount: Math.round(totalDiscount / totalDeals),
      totalDeals,
      maxDiscount: Math.round(maxDiscount)
    };
  }, [deals]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
      {/* HERO Section */}
      <section className="relative bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 rounded-3xl p-8 md:p-12 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1 text-white">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
              Discover <span className="text-yellow-300">Amazing</span> Food Deals 🍽️
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Get up to {dealStats.maxDiscount}% off on your favorite restaurants. Order now for fast delivery!
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="max-w-2xl">
              <div className="flex flex-col sm:flex-row gap-3">
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search restaurants, cuisines, or deals..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search className="text-gray-400" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    bgcolor: 'white',
                    borderRadius: '12px',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&:hover fieldset': {
                        borderColor: 'transparent',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'transparent',
                      },
                    },
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Search />}
                  sx={{
                    bgcolor: 'white',
                    color: 'purple.600',
                    borderRadius: '12px',
                    px: 4,
                    py: 1.5,
                    fontWeight: 'bold',
                    '&:hover': {
                      bgcolor: 'gray.100',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s',
                  }}
                >
                  Search
                </Button>
              </div>
            </form>
          </div>
          
          {/* Deal Statistics */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold">{dealStats.totalDeals}</div>
                <div className="text-sm opacity-80">Active Deals</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{dealStats.avgDiscount}%</div>
                <div className="text-sm opacity-80">Avg. Discount</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">30min</div>
                <div className="text-sm opacity-80">Avg. Delivery</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">4.8</div>
                <div className="text-sm opacity-80">Avg. Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Active Filters Bar */}
      {(selectedCuisine || search) && (
        <div className="bg-white rounded-xl p-4 shadow-lg border">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FilterList className="text-gray-500" />
              <span className="font-medium">Active Filters:</span>
              {selectedCuisine && (
                <Chip
                  label={`Cuisine: ${selectedCuisine}`}
                  onDelete={() => setSelectedCuisine("")}
                  color="primary"
                  variant="outlined"
                />
              )}
              {search && (
                <Chip
                  label={`Search: "${search}"`}
                  onDelete={() => setSearch("")}
                  color="secondary"
                  variant="outlined"
                />
              )}
            </div>
            <Button
              onClick={clearFilters}
              variant="text"
              color="error"
              size="small"
            >
              Clear All
            </Button>
          </div>
        </div>
      )}

      {/* Deals Section */}
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <LocalFireDepartment className="text-4xl text-orange-500" />
            <div>
              <Typography variant="h4" fontWeight="bold" className="text-gray-800">
                🔥 Today's Hot Deals
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {deals?.length || 0} deals available with amazing discounts
              </Typography>
            </div>
          </div>
          <Button
            onClick={handleViewAllDeals}
            variant="contained"
            endIcon={<ArrowForward />}
            sx={{ 
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
              }
            }}
          >
            View All Deals
          </Button>
        </div>

        {dealsError ? (
          <Alert severity="error" className="rounded-xl">
            Failed to load deals. Please try again.
          </Alert>
        ) : dealsLoading ? (
          <Box display="flex" justifyContent="center" py={12}>
            <CircularProgress />
          </Box>
        ) : !deals || deals.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <LocalFireDepartment className="text-6xl text-gray-300 mb-4" />
            <Typography variant="h6" color="text.secondary" className="mb-2">
              No deals available right now
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Check back later for amazing offers
            </Typography>
          </div>
        ) : (
          <>
            <Grid container spacing={3}>
              {deals.slice(0, 6).map((deal) => (
                <Grid item xs={12} sm={6} md={4} key={deal.id}>
                  <DealCard 
                    deal={deal}
                    onFavoriteToggle={(id, e) => {
                      e.stopPropagation();
                      toggleFavorite(deal, 'deal');
                    }}
                    isFavorite={isFavorite(deal.id, 'deal')}
                  />
                </Grid>
              ))}
            </Grid>

            {/* Show remaining deals count */}
            {deals.length > 6 && (
              <div className="text-center mt-6">
                <Typography variant="body1" color="text.secondary">
                  Showing 6 of {deals.length} deals. 
                  <Button 
                    onClick={handleViewAllDeals}
                    variant="text" 
                    color="primary"
                    className="ml-2"
                  >
                    View all {deals.length} deals
                  </Button>
                </Typography>
              </div>
            )}
          </>
        )}

        {/* Special Offer Banner */}
        {featuredDeals.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-6 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <Whatshot className="text-5xl" />
                <div>
                  <Typography variant="h5" fontWeight="bold">
                    Mega Discounts Available!
                  </Typography>
                  <Typography variant="body2" className="opacity-90">
                    Save up to {dealStats.maxDiscount}% on selected deals
                  </Typography>
                </div>
              </div>
              <Button
                variant="contained"
                sx={{
                  bgcolor: 'white',
                  color: 'red.600',
                  fontWeight: 'bold',
                  px: 4,
                  py: 1.5,
                  borderRadius: '12px',
                  '&:hover': {
                    bgcolor: 'gray.100',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s',
                }}
                endIcon={<Discount />}
                onClick={handleViewAllDeals}
              >
                View All Offers
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Cuisines Section */}
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <Typography variant="h4" fontWeight="bold" className="text-gray-800">
            🍴 Explore Cuisines
          </Typography>
          <Button
            component={Link}
            to="/cuisines"
            variant="text"
            endIcon={<ArrowForward />}
            className="text-purple-600"
          >
            View All Cuisines
          </Button>
        </div>

        {cuisinesLoading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress size={40} />
          </Box>
        ) : (
          <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-thin scrollbar-thumb-pink-300 scrollbar-track-gray-100">
            {cuisines?.slice(0, 8).map((cuisine) => {
              const slug = cuisine.name.toLowerCase().replace(/\s+/g, "-");
              
              return (
                <Link 
                  key={cuisine.id} 
                  to={`/cuisines/${slug}`}
                  className="no-underline"
                >
                  <CuisineCard
                    cuisine={cuisine}
                    isActive={selectedCuisine === cuisine.name}
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedCuisine(selectedCuisine === cuisine.name ? "" : cuisine.name);
                      setPage(1);
                    }}
                  />
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Restaurants Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Typography variant="h4" fontWeight="bold" className="text-gray-800 mb-2">
              🏪 Top Restaurants Near You
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {total} restaurants {selectedCuisine ? `serving ${selectedCuisine}` : 'available'}
            </Typography>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge badgeContent={total} color="primary" showZero>
              <Restaurant color="action" />
            </Badge>
            <Button
              onClick={handleViewAllRestaurants}
              variant="contained"
              sx={{ 
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                }
              }}
            >
              View All Restaurants
            </Button>
          </div>
        </div>

        {restaurantsLoading ? (
          <Box display="flex" justifyContent="center" py={12}>
            <CircularProgress />
          </Box>
        ) : restaurantsError ? (
          <Alert severity="error" className="rounded-xl">
            Failed to load restaurants
          </Alert>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <Restaurant className="text-6xl text-gray-300 mb-4" />
            <Typography variant="h6" color="text.secondary" className="mb-2">
              No restaurants found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try changing your search or filters
            </Typography>
            <Button 
              onClick={clearFilters}
              variant="outlined" 
              className="mt-4"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            <Grid container spacing={3}>
              {restaurants.map((restaurant) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={restaurant.id}>
                  <div 
                    onClick={() => handleRestaurantClick(restaurant.id)} 
                    className="cursor-pointer"
                  >
                    <RestaurantCard 
                      restaurant={restaurant}
                      onFavoriteToggle={() => toggleFavorite(restaurant, 'restaurant')}
                      isFavorite={isFavorite(restaurant.id, 'restaurant')}
                    />
                  </div>
                </Grid>
              ))}
            </Grid>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                  shape="rounded"
                  size="large"
                  showFirstButton
                  showLastButton
                />
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};