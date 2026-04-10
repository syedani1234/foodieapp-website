import API_BASE_URL from "../config/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for adding auth tokens if needed
api.interceptors.request.use(
  (config) => {
    // You can add authentication tokens here if needed
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED") {
      throw new Error("Request timeout. Please check your connection.");
    }

    if (!error.response) {
      throw new Error("Network error. Please check your internet connection.");
    }

    return Promise.reject(error);
  },
);

/* =========================
   CACHE KEYS
========================= */
export const QUERY_KEYS = {
  CUISINES: "cuisines",
  CUISINE_DETAILS: (slug) => ["cuisine-details", slug],
  RESTAURANTS_BY_CUISINE: (slug) => ["restaurants-by-cuisine", slug],
  RESTAURANTS: "restaurants",
  RESTAURANT_DETAILS: (id) => ["restaurant-details", id],
};

/* =========================
   API FUNCTIONS
========================= */

/**
 * Fetch all cuisines from /api/cuisines endpoint
 * @returns {Promise<Array>} Array of cuisine objects
 */
export const fetchCuisines = async () => {
  try {
    console.log("ðŸ“Š Fetching all cuisines...");
    const { data } = await api.get("/api/cuisines");

    // Validate response format
    if (!Array.isArray(data)) {
      console.warn("Unexpected response format for cuisines:", data);
      return [];
    }

    console.log(`âœ… Found ${data.length} cuisines`);
    return data.map((cuisine) => ({
      ...cuisine,
      // Ensure consistent properties
      id: cuisine.id || Date.now(),
      name: cuisine.name || "Unnamed Cuisine",
      description: cuisine.description || "",
      restaurant_count: cuisine.restaurant_count || 0,
      is_featured: Boolean(cuisine.is_featured || cuisine.featured),
      image: cuisine.image || cuisine.image_url || null,
      slug: cuisine.slug || (cuisine.name ? nameToSlug(cuisine.name) : ""),
    }));
  } catch (error) {
    console.error("âŒ Error fetching cuisines:", error);

    // Provide helpful error messages
    if (error.response?.status === 404) {
      throw new Error("Cuisines endpoint not found. Please check the server.");
    }

    if (error.response?.status === 500) {
      throw new Error("Server error while fetching cuisines.");
    }

    throw new Error(error.message || "Failed to fetch cuisines");
  }
};

/**
 * Fetch restaurants by cuisine slug
 * @param {string} cuisineSlug - The cuisine slug (e.g., 'italian', 'fast-food')
 * @returns {Promise<Object>} Object containing cuisine details and restaurants
 */
export const fetchRestaurantsByCuisineSlug = async (cuisineSlug) => {
  try {
    if (!cuisineSlug || typeof cuisineSlug !== "string") {
      throw new Error("Invalid cuisine slug provided");
    }

    console.log(`ðŸ½ï¸ Fetching restaurants for cuisine: ${cuisineSlug}`);
    const { data } = await api.get(`/cuisines/${cuisineSlug}`);

    // Validate response structure
    if (!data || typeof data !== "object") {
      throw new Error("Invalid response format from server");
    }

    // Handle error response
    if (data.error) {
      throw new Error(data.error);
    }

    // Normalize response structure
    const normalizedData = {
      cuisine: data.cuisine || {
        id: Date.now(),
        name: cuisineSlug.replace(/-/g, " "),
        slug: cuisineSlug,
      },
      restaurants: Array.isArray(data.restaurants) ? data.restaurants : [],
      count:
        data.count ||
        (Array.isArray(data.restaurants) ? data.restaurants.length : 0),
    };

    console.log(
      `âœ… Found ${normalizedData.restaurants.length} restaurants for ${cuisineSlug}`,
    );
    return normalizedData;
  } catch (error) {
    console.error(
      `âŒ Error fetching restaurants for cuisine "${cuisineSlug}":`,
      error,
    );

    // Provide specific error messages based on status
    if (error.response?.status === 404) {
      throw new Error(
        `Cuisine "${cuisineSlug}" not found. It may have been removed or the URL is incorrect.`,
      );
    }

    if (error.response?.status === 500) {
      throw new Error(
        `Server error while fetching ${cuisineSlug} restaurants.`,
      );
    }

    throw new Error(error.message || "Failed to fetch restaurants");
  }
};

/**
 * Fetch all restaurants
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} Array of restaurant objects
 */
export const fetchRestaurants = async (filters = {}) => {
  try {
    console.log("ðŸª Fetching all restaurants...");
    const { data } = await api.get("/restaurants", { params: filters });

    if (!Array.isArray(data)) {
      console.warn("Unexpected response format for restaurants:", data);
      return [];
    }

    console.log(`âœ… Found ${data.length} restaurants`);
    return data;
  } catch (error) {
    console.error("âŒ Error fetching restaurants:", error);
    throw new Error(error.message || "Failed to fetch restaurants");
  }
};

/**
 * Fetch restaurant details by ID
 * @param {string|number} restaurantId - The restaurant ID
 * @returns {Promise<Object>} Restaurant details with menu
 */
export const fetchRestaurantDetails = async (restaurantId) => {
  try {
    console.log(`ðŸ´ Fetching details for restaurant ID: ${restaurantId}`);
    const { data } = await api.get(`/api/restaurants/${restaurantId}`);

    if (!data || typeof data !== "object") {
      throw new Error("Invalid response format");
    }

    console.log(`âœ… Loaded restaurant: ${data.name}`);
    return data;
  } catch (error) {
    console.error(
      `âŒ Error fetching restaurant details for ID ${restaurantId}:`,
      error,
    );

    if (error.response?.status === 404) {
      throw new Error(`Restaurant with ID ${restaurantId} not found.`);
    }

    throw new Error(error.message || "Failed to fetch restaurant details");
  }
};

/* =========================
   REACT QUERY HOOKS
========================= */

/**
 * Hook to fetch all cuisines
 * @param {Object} options - React Query options
 * @returns {Object} Query result
 */
export const useCuisineData = (options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CUISINES],
    queryFn: fetchCuisines,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    ...options,
  });
};

/**
 * Hook to fetch restaurants by cuisine slug
 * @param {string} cuisineSlug - The cuisine slug
 * @param {Object} options - React Query options
 * @returns {Object} Query result
 */
export const useRestaurantsByCuisineSlug = (cuisineSlug, options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.RESTAURANTS_BY_CUISINE(cuisineSlug),
    queryFn: () => fetchRestaurantsByCuisineSlug(cuisineSlug),
    enabled: !!cuisineSlug && typeof cuisineSlug === "string",
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    retryDelay: 1000,
    ...options,
  });
};

/**
 * Hook to fetch all restaurants
 * @param {Object} filters - Filter parameters
 * @param {Object} options - React Query options
 * @returns {Object} Query result
 */
export const useRestaurants = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.RESTAURANTS, filters],
    queryFn: () => fetchRestaurants(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    ...options,
  });
};

/**
 * Hook to fetch restaurant details
 * @param {string|number} restaurantId - The restaurant ID
 * @param {Object} options - React Query options
 * @returns {Object} Query result
 */
export const useRestaurantDetails = (restaurantId, options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.RESTAURANT_DETAILS(restaurantId),
    queryFn: () => fetchRestaurantDetails(restaurantId),
    enabled: !!restaurantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    ...options,
  });
};

/* =========================
   UTILITY FUNCTIONS
========================= */

/**
 * Convert cuisine name to URL slug
 * @param {string} name - Cuisine name
 * @returns {string} URL-friendly slug
 */
export const nameToSlug = (name) => {
  if (!name || typeof name !== "string") return "";
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

/**
 * Convert slug back to display name
 * @param {string} slug - URL slug
 * @returns {string} Display name
 */
export const slugToName = (slug) => {
  if (!slug || typeof slug !== "string") return "";
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Get cuisine by name from cuisines array
 * @param {Array} cuisines - Array of cuisine objects
 * @param {string} name - Cuisine name to find
 * @returns {Object|null} Found cuisine or null
 */
export const getCuisineByName = (cuisines, name) => {
  if (!Array.isArray(cuisines) || !name) return null;
  return cuisines.find(
    (c) => c && c.name && c.name.toLowerCase() === name.toLowerCase(),
  );
};

/**
 * Get cuisine by slug from cuisines array
 * @param {Array} cuisines - Array of cuisine objects
 * @param {string} slug - Cuisine slug to find
 * @returns {Object|null} Found cuisine or null
 */
export const getCuisineBySlug = (cuisines, slug) => {
  if (!Array.isArray(cuisines) || !slug) return null;
  return cuisines.find(
    (c) => c && (c.slug === slug || nameToSlug(c.name) === slug),
  );
};

/**
 * Filter cuisines by search query
 * @param {Array} cuisines - Array of cuisine objects
 * @param {string} query - Search query
 * @returns {Array} Filtered cuisines
 */
export const searchCuisines = (cuisines, query) => {
  if (!Array.isArray(cuisines) || !query) return cuisines;

  const searchTerm = query.toLowerCase();
  return cuisines.filter(
    (cuisine) =>
      cuisine.name?.toLowerCase().includes(searchTerm) ||
      cuisine.description?.toLowerCase().includes(searchTerm),
  );
};

/**
 * Sort cuisines by various criteria
 * @param {Array} cuisines - Array of cuisine objects
 * @param {string} sortBy - Sort criteria ('name', 'restaurants', 'featured')
 * @returns {Array} Sorted cuisines
 */
export const sortCuisines = (cuisines, sortBy = "name") => {
  if (!Array.isArray(cuisines)) return [];

  const sorted = [...cuisines];

  switch (sortBy) {
    case "name":
      return sorted.sort((a, b) => a.name?.localeCompare(b.name));
    case "restaurants":
      return sorted.sort(
        (a, b) => (b.restaurant_count || 0) - (a.restaurant_count || 0),
      );
    case "featured":
      return sorted.sort((a, b) => {
        const aFeatured = a.is_featured || a.featured;
        const bFeatured = b.is_featured || b.featured;
        return (bFeatured ? 1 : 0) - (aFeatured ? 1 : 0);
      });
    default:
      return sorted;
  }
};

/* =========================
   CACHE MANAGEMENT
========================= */

/**
 * Prefetch cuisines data
 * @param {Object} queryClient - React Query client
 */
export const prefetchCuisines = async (queryClient) => {
  await queryClient.prefetchQuery({
    queryKey: [QUERY_KEYS.CUISINES],
    queryFn: fetchCuisines,
  });
};

/**
 * Invalidate cuisine-related queries
 * @param {Object} queryClient - React Query client
 */
export const invalidateCuisineQueries = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CUISINES] });
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RESTAURANTS] });
};

/**
 * Update cuisine in cache
 * @param {Object} queryClient - React Query client
 * @param {Object} updatedCuisine - Updated cuisine object
 */
export const updateCuisineInCache = (queryClient, updatedCuisine) => {
  queryClient.setQueryData([QUERY_KEYS.CUISINES], (oldData) => {
    if (!Array.isArray(oldData)) return [updatedCuisine];

    const index = oldData.findIndex((c) => c.id === updatedCuisine.id);
    if (index >= 0) {
      const newData = [...oldData];
      newData[index] = { ...oldData[index], ...updatedCuisine };
      return newData;
    }

    return [...oldData, updatedCuisine];
  });
};

/**
 * Remove cuisine from cache
 * @param {Object} queryClient - React Query client
 * @param {string|number} cuisineId - Cuisine ID to remove
 */
export const removeCuisineFromCache = (queryClient, cuisineId) => {
  queryClient.setQueryData([QUERY_KEYS.CUISINES], (oldData) => {
    if (!Array.isArray(oldData)) return [];
    return oldData.filter((c) => c.id !== cuisineId);
  });
};

/* =========================
   VALIDATION FUNCTIONS
========================= */

/**
 * Validate cuisine object
 * @param {Object} cuisine - Cuisine object to validate
 * @returns {boolean} True if valid
 */
export const isValidCuisine = (cuisine) => {
  return (
    cuisine &&
    typeof cuisine === "object" &&
    cuisine.id &&
    cuisine.name &&
    typeof cuisine.name === "string"
  );
};

/**
 * Validate restaurant object
 * @param {Object} restaurant - Restaurant object to validate
 * @returns {boolean} True if valid
 */
export const isValidRestaurant = (restaurant) => {
  return (
    restaurant &&
    typeof restaurant === "object" &&
    restaurant.id &&
    restaurant.name &&
    typeof restaurant.name === "string"
  );
};

/* =========================
   DEBUG UTILITIES
========================= */

/**
 * Log cache state for debugging
 * @param {Object} queryClient - React Query client
 */
export const logCacheState = (queryClient) => {
  console.log("ðŸ“¦ Current Cache State:");
  const cache = queryClient.getQueryCache();
  const queries = cache.getAll();

  queries.forEach((query) => {
    console.log(`  ${query.queryKey[0]}:`, {
      state: query.state.status,
      updatedAt: query.state.dataUpdatedAt,
      data: query.state.data,
    });
  });
};

/**
 * Clear all cuisine-related cache
 * @param {Object} queryClient - React Query client
 */
export const clearCuisineCache = (queryClient) => {
  queryClient.removeQueries({ queryKey: [QUERY_KEYS.CUISINES] });
  queryClient.removeQueries({ queryKey: [QUERY_KEYS.RESTAURANTS] });
  console.log("ðŸ§¹ Cleared cuisine cache");
};
