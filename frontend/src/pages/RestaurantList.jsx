import API_BASE_URL from '../config/api'
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { formatImageUrl } from "../utils/formatImageUrl";

export default function RestaurantList() {
  const [restaurants, setRestaurants] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const limit = 12;

  const fetchRestaurants = () => {
    setLoading(true);
    axios
      .get("${import.meta.env.VITE_API_URL || "http://localhost:4000"}/restaurants", {
        params: { q: search, _page: page, _limit: limit },
      })
      .then((res) => {
        setRestaurants(res.data);
        const total = res.headers["x-total-count"] || 0;
        setTotalCount(Number(total));
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to fetch restaurants.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRestaurants();
  }, [search, page]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">ðŸ´ All Restaurants</h1>

      {/* Search */}
      <div className="mb-6 flex justify-center">
        <input
          type="text"
          placeholder="Search for a restaurant..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/2 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      {/* Loading / Error */}
      {loading && <p className="text-center">Loading restaurants...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {/* Restaurants Grid */}
      {restaurants?.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {restaurants.map((r) => (
            <div
              key={r.id}
              onClick={() => navigate(`/restaurants/${r.id}`)}
              className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition bg-white"
            >
              {/* Restaurant Image */}
              {r.image && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={formatImageUrl(r.image)}
                    alt={r.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-sm font-medium text-gray-800">{r.cuisine_name}</span>
                  </div>
                </div>
              )}
              
              {/* Restaurant Info */}
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-lg font-bold text-gray-800 truncate">{r.name}</h2>
                  {r.rating && (
                    <div className="flex items-center bg-yellow-50 px-2 py-1 rounded">
                      <span className="text-yellow-500 text-sm font-bold">â˜… {r.rating}</span>
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{r.description}</p>
                
                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <span className="mr-3">ðŸ“ {r.location || 'City location'}</span>
                  {r.delivery_time && (
                    <span>â±ï¸ {r.delivery_time} min</span>
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-gray-700">
                    {r.delivery_fee === 0 ? (
                      <span className="text-green-600 font-medium">Free delivery</span>
                    ) : (
                      <span>Delivery: Rs. {r.delivery_fee || 50}</span>
                    )}
                  </div>
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-800">
                    View Menu â†’
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !loading && (
          <div className="text-center py-10">
            <div className="text-5xl mb-4">ðŸ½ï¸</div>
            <p className="text-gray-500 text-lg">No restaurants found</p>
            <p className="text-gray-400">Try searching for something else</p>
          </div>
        )
      )}

      {/* Pagination */}
      {totalCount > limit && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
          >
            â† Previous
          </button>
          <span className="font-semibold text-gray-700">
            Page {page} of {Math.ceil(totalCount / limit)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(totalCount / limit)}
            className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
          >
            Next â†’
          </button>
        </div>
      )}
    </div>
  );
}


