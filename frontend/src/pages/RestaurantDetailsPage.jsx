import API_BASE_URL from './config/api'
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import { formatImageUrl } from "../utils/formatImageUrl";
import MenuModal from "../components/MenuModal";

export default function RestaurantDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, editingItem, setEditingItem } = useCart();
  const { addToFavorites, isFavorite } = useFavorites();

  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalItem, setModalItem] = useState(null);

  const safePrice = useCallback((price) => {
    if (typeof price === "number") return price;
    if (typeof price === "string") {
      const cleaned = price.replace(/[^0-9.]/g, "");
      const num = Number(cleaned);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  }, []);

  // Fetch restaurant details with menu, options, toppings, add-ons
  useEffect(() => {
    setLoading(true);
    axios
      .get(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/restaurants/${id}`)
      .then((res) => {
        setRestaurant(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch restaurant data.");
        setLoading(false);
      });
  }, [id]);

  const handleMenuItemClick = (item) => {
    setEditingItem(item);
    setModalItem(item);
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;
  if (!restaurant) return <p className="text-center mt-10">Restaurant not found.</p>;

  // Group menu items by category
  const menuByCategory = (restaurant.menu || []).reduce((acc, item) => {
    const cat = item.category_name || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  // Helper function to get base price
  const getBasePrice = (item) => {
    // Try base_price first
    const basePrice = safePrice(item.base_price);
    
    // If no base_price, try regular price
    if (basePrice === 0) {
      return safePrice(item.price);
    }
    
    return basePrice;
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto pb-24">
      {/* Restaurant Header */}
      <div className="mb-8">
        <div className="relative h-64 md:h-80 rounded-xl overflow-hidden mb-6">
          <img
            src={formatImageUrl(restaurant.image)}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          <div className="absolute bottom-6 left-6 text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{restaurant.name}</h1>
            <div className="flex items-center gap-4">
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                {restaurant.cuisine_name}
              </span>
              {restaurant.rating && (
                <span className="flex items-center">
                  <span className="text-yellow-300 mr-1">â˜…</span>
                  <span className="font-medium">{restaurant.rating}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600">ðŸ“</span>
              </div>
              <div>
                <p className="font-medium text-gray-800">Location</p>
                <p className="text-gray-600 text-sm">{restaurant.location}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600">â±ï¸</span>
              </div>
              <div>
                <p className="font-medium text-gray-800">Delivery Time</p>
                <p className="text-gray-600 text-sm">{restaurant.delivery_time || '30-45'} mins</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600">ðŸ’°</span>
              </div>
              <div>
                <p className="font-medium text-gray-800">Delivery Fee</p>
                <p className="text-gray-600 text-sm">
                  {restaurant.delivery_fee === 0 ? 'Free' : `Rs. ${restaurant.delivery_fee || 50}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {restaurant.description && (
          <p className="text-gray-700 mb-8 p-4 bg-gray-50 rounded-lg">
            {restaurant.description}
          </p>
        )}
      </div>

      {/* Menu Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Menu</h2>
          <p className="text-gray-500">
            {restaurant.menu?.length || 0} items available
          </p>
        </div>
        
        {Object.keys(menuByCategory).length > 0 ? (
          Object.entries(menuByCategory).map(([category, items]) => (
            <div key={category} className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-xl md:text-2xl font-bold text-gray-800">{category}</h3>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {items.length} items
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {items.map((item) => {
                  const basePrice = getBasePrice(item);
                  
                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer"
                      onClick={() => handleMenuItemClick(item)}
                    >
                      <div className="p-5">
                        <div className="flex gap-4">
                          {/* Item Image */}
                          {item.image && (
                            <div className="w-24 h-24 flex-shrink-0">
                              <img
                                src={formatImageUrl(item.image)}
                                alt={item.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            </div>
                          )}
                          
                          {/* Item Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="text-lg font-bold text-gray-800 truncate">
                                {item.name}
                              </h4>
                              <span className="text-lg font-bold text-[#d70f64] ml-2 whitespace-nowrap">
                                Rs. {basePrice.toFixed(0)}
                              </span>
                            </div>
                            
                            {item.description && (
                              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                            
                            {/* Show available options if any */}
                            {(item.addOns?.length > 0 || item.toppings?.length > 0 || item.variations?.length > 0) && (
                              <div className="flex flex-wrap gap-2 mb-4">
                                {item.addOns?.length > 0 && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                    +{item.addOns.length} add-ons
                                  </span>
                                )}
                                {item.toppings?.length > 0 && (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                    +{item.toppings.length} toppings
                                  </span>
                                )}
                                {item.variations?.length > 0 && (
                                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                    +{item.variations.length} variations
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {/* Action Buttons */}
                            <div className="flex items-center justify-between">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToFavorites({ 
                                    ...item, 
                                    restaurantId: restaurant.id,
                                    restaurantName: restaurant.name 
                                  });
                                }}
                                disabled={isFavorite(item.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                                  isFavorite(item.id)
                                    ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                                    : "bg-red-50 text-red-600 hover:bg-red-100"
                                }`}
                              >
                                <span>{isFavorite(item.id) ? "â¤ï¸" : "ðŸ¤"}</span>
                                <span>{isFavorite(item.id) ? "Added" : "Favorite"}</span>
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMenuItemClick(item);
                                }}
                                className="px-4 py-2 bg-[#d70f64] text-white rounded-lg font-medium hover:bg-[#b80d55] transition"
                              >
                                Add to Cart
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-xl">
            <div className="text-5xl mb-4">ðŸ½ï¸</div>
            <p className="text-gray-500 text-lg">No menu available</p>
            <p className="text-gray-400">Check back later for updates</p>
          </div>
        )}
      </div>

      {/* Back Button */}
      <div className="mt-8 text-center">
        <button
          onClick={() => navigate("/restaurants")}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
        >
          <span>â†</span>
          <span>Back to Restaurants</span>
        </button>
      </div>

      {/* Menu Modal */}
      {modalItem && (
        <MenuModal
          item={modalItem}
          onClose={() => {
            setModalItem(null);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}


