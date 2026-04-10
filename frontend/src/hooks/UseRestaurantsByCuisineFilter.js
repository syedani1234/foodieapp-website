import API_BASE_URL from "../config/api";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useRestaurantsByCuisineFilter = (cuisineName, enabled = true) => {
  return useQuery({
    queryKey: ["restaurants-by-cuisine-filter", cuisineName],
    queryFn: async () => {
      if (!cuisineName) return { items: [], total: 0 };

      try {
        const response = await axios.get(`${API_BASE_URL}/restaurants`, {
          params: {
            cuisine_like: cuisineName,
            _page: 1,
            _limit: 100,
          },
        });

        const items = response.data || [];
        const total =
          parseInt(response.headers["x-total-count"]) || items.length;

        return {
          items,
          total,
        };
      } catch (error) {
        console.error(
          "âŒ Error filtering restaurants by cuisine:",
          error.message,
        );
        return { items: [], total: 0 };
      }
    },
    enabled: enabled && !!cuisineName,
    staleTime: 3 * 60 * 1000,
  });
};
