import API_BASE_URL from "../config/api";

// src/hooks/useRestaurantData.js
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

/**
 * Fetch restaurants from backend API
 * Supports search (restaurant name + menu items), cuisine filter, pagination
 *
 * @param {Object} params
 * @param {string} params.search - search query for restaurant/menu
 * @param {string} params.cuisine - cuisine filter
 * @param {number} params.page - page number for pagination
 * @param {number} params.limit - number of items per page
 * @returns {Promise<{items: Array, total: number}>}
 */
const fetchRestaurants = async ({
  search = "",
  cuisine = "",
  page = 1,
  limit = 12,
}) => {
  try {
    console.log("ðŸ” Fetching restaurants with params:", {
      search,
      cuisine,
      page,
      limit,
    });

    // Build query parameters based on your backend API
    const params = {
      page,
      limit,
    };

    // Add search parameter if provided
    if (search.trim()) {
      params.search = search.trim();
    }

    // Add cuisine parameter if provided
    if (cuisine.trim()) {
      // Try different possible parameter names for cuisine
      params.cuisine = cuisine.trim();
      // Alternative: params.cuisineType = cuisine.trim();
      // Alternative: params.category = cuisine.trim();
    }

    const response = await axios.get(`${API_BASE_URL}/restaurants`, {
      params,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000, // 10 second timeout
    });

    console.log("âœ… API Response:", {
      data: response.data,
      headers: response.headers,
      status: response.status,
    });

    // Handle different response structures
    let items = [];
    let total = 0;

    if (Array.isArray(response.data)) {
      // If response is a simple array
      items = response.data;
      total = items.length;
    } else if (response.data && Array.isArray(response.data.items)) {
      // If response has { items: [], total: number } structure
      items = response.data.items;
      total = response.data.total || items.length;
    } else if (response.data && Array.isArray(response.data.data)) {
      // If response has { data: [], total: number } structure
      items = response.data.data;
      total = response.data.total || items.length;
    } else if (response.data && Array.isArray(response.data.restaurants)) {
      // If response has { restaurants: [], total: number } structure
      items = response.data.restaurants;
      total = response.data.total || items.length;
    } else {
      // Fallback - try to extract data from response
      items = response.data || [];
      total =
        response.headers["x-total-count"] ||
        response.data?.total ||
        response.data?.count ||
        items.length;
    }

    console.log("ðŸ“Š Processed data:", { items, total });

    return { items, total };
  } catch (err) {
    console.error("âŒ Error fetching restaurants:", {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
      config: {
        url: err.config?.url,
        params: err.config?.params,
      },
    });

    // Provide more specific error messages
    if (err.response) {
      if (err.response.status === 404) {
        throw new Error(
          "Restaurants API endpoint not found. Please check the server.",
        );
      }
      if (err.response.status >= 500) {
        throw new Error("Server error. Please try again later.");
      }
    }

    throw new Error(
      err.message || "Failed to fetch restaurants. Please try again.",
    );
  }
};

/**
 * Custom React Query hook for restaurants
 *
 * @param {Object} options
 * @param {string} options.search - search string
 * @param {string} options.cuisine - cuisine filter
 * @param {number} options.page - page number
 * @param {number} options.limit - items per page
 * @param {function} options.onSuccess - optional success callback
 * @param {function} options.onError - optional error callback
 * @returns {Object} React Query result
 */
export const useRestaurantsData = (
  { search = "", cuisine = "", page = 1, limit = 12 } = {},
  onSuccess,
  onError,
) => {
  return useQuery({
    queryKey: ["restaurants", { search, cuisine, page, limit }],
    queryFn: () => fetchRestaurants({ search, cuisine, page, limit }),
    keepPreviousData: true, // preserve previous page data while fetching new
    staleTime: 1000 * 60, // 1 minute cache
    retry: 2, // retry twice on failure
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    onSuccess: (data) => {
      console.log("ðŸŽ¯ Query successful:", data);
      if (onSuccess) onSuccess(data);
    },
    onError: (error) => {
      console.error("ðŸ’¥ Query failed:", error);
      if (onError) onError(error);
    },
  });
};
