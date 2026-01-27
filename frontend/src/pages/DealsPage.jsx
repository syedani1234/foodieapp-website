// src/pages/DealsPage.jsx - UPDATED VERSION
import { useState } from "react";
import { useDealsData } from "../hooks/useDealsData";
import { useFavorites } from "../context/FavoritesContext";
import { useCart } from "../context/CartContext";
import { DealCard } from "../components/DealCard";

export const DealsPage = () => {
  const { data: deals, isLoading, isError, refetch } = useDealsData();
  const { addToFavorites, isFavorite, favorites, removeFromFavorites } = useFavorites();
  const { addToCart } = useCart();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const handleFavoriteToggle = (dealId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const deal = deals?.find(d => d.id === dealId);
    if (!deal) return;

    const favoriteItem = {
      id: deal.id,
      name: deal.title || deal.name,
      description: deal.description,
      image: deal.image,
      price: deal.discount_price || deal.price,
      original_price: deal.original_price,
      restaurant: deal.restaurant_name,
      restaurant_id: deal.restaurant_id,
      isDeal: true,
      discount_percent: deal.discount_percent
    };

    if (isFavorite(dealId)) {
      removeFromFavorites(dealId);
    } else {
      addToFavorites(favoriteItem);
    }
  };

  // Filter deals based on search and category
  const filteredDeals = deals?.filter(deal => {
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesSearch = (
        deal.title?.toLowerCase().includes(term) ||
        deal.description?.toLowerCase().includes(term) ||
        deal.restaurant_name?.toLowerCase().includes(term) ||
        deal.tags?.toLowerCase().includes(term)
      );
      if (!matchesSearch) return false;
    }

    // Category filter
    if (selectedCategory !== "all") {
      const title = (deal.title || "").toLowerCase();
      const description = (deal.description || "").toLowerCase();
      const tags = (deal.tags || "").toLowerCase();
      
      switch (selectedCategory) {
        case "pizza":
          return title.includes('pizza') || description.includes('pizza') || tags.includes('pizza');
        case "burger":
          return title.includes('burger') || description.includes('burger') || tags.includes('burger');
        case "combo":
          return title.includes('combo') || description.includes('combo') || tags.includes('combo');
        case "customizable":
          return title.includes('pizza') || title.includes('burger') || description.includes('pizza') || 
                 description.includes('burger') || title.includes('combo') || description.includes('combo');
        case "high-discount":
          const discountPercent = deal.discount_percent || 
            ((deal.original_price - deal.discount_price) / deal.original_price) * 100;
          return discountPercent > 50;
        default:
          return true;
      }
    }

    return true;
  }) || [];

  // Calculate stats
  const totalDeals = filteredDeals.length;
  const pizzaDeals = filteredDeals.filter(d => 
    (d.title?.toLowerCase().includes('pizza') || 
     d.description?.toLowerCase().includes('pizza') ||
     d.tags?.toLowerCase().includes('pizza'))
  ).length;
  const burgerDeals = filteredDeals.filter(d => 
    (d.title?.toLowerCase().includes('burger') || 
     d.description?.toLowerCase().includes('burger') ||
     d.tags?.toLowerCase().includes('burger'))
  ).length;
  const comboDeals = filteredDeals.filter(d => 
    (d.title?.toLowerCase().includes('combo') || 
     d.description?.toLowerCase().includes('combo') ||
     d.tags?.toLowerCase().includes('combo'))
  ).length;
  const customizableDeals = filteredDeals.filter(d => {
    const title = (d.title || "").toLowerCase();
    return title.includes('pizza') || title.includes('burger') || title.includes('combo');
  }).length;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white shadow rounded-2xl overflow-hidden">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center py-12">
          <div className="text-5xl mb-4">âš ï¸</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Failed to load deals
          </h3>
          <button
            onClick={() => refetch()}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              ðŸ”¥ Hot Deals & Combos
            </h1>
            <p className="text-gray-600 mt-2">
              Customizable pizza, burger, and combo deals from top restaurants
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search deals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              ðŸ”
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                âœ•
              </button>
            )}
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedCategory === "all"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Deals ({deals?.length || 0})
          </button>
          <button
            onClick={() => setSelectedCategory("pizza")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedCategory === "pizza"
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            ðŸ• Pizza ({pizzaDeals})
          </button>
          <button
            onClick={() => setSelectedCategory("burger")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedCategory === "burger"
                ? "bg-yellow-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            ðŸ” Burger ({burgerDeals})
          </button>
          <button
            onClick={() => setSelectedCategory("combo")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedCategory === "combo"
                ? "bg-purple-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            ðŸ½ï¸ Combo ({comboDeals})
          </button>
          <button
            onClick={() => setSelectedCategory("customizable")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedCategory === "customizable"
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            âš™ï¸ Customizable ({customizableDeals})
          </button>
          <button
            onClick={() => setSelectedCategory("high-discount")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedCategory === "high-discount"
                ? "bg-red-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            ðŸ”¥ 50%+ Off
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <div className="text-2xl font-bold text-blue-700">{totalDeals}</div>
            <div className="text-sm text-blue-600">Total Deals</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
            <div className="text-2xl font-bold text-orange-700">{pizzaDeals}</div>
            <div className="text-sm text-orange-600">Pizza Deals</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
            <div className="text-2xl font-bold text-yellow-700">{burgerDeals}</div>
            <div className="text-sm text-yellow-600">Burger Deals</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
            <div className="text-2xl font-bold text-purple-700">{comboDeals}</div>
            <div className="text-sm text-purple-600">Combo Deals</div>
          </div>
        </div>
      </div>

      {/* Results Info */}
      {searchTerm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-700">
            Found {totalDeals} deals matching "{searchTerm}"
            <button
              onClick={() => setSearchTerm("")}
              className="ml-2 text-blue-600 hover:text-blue-800"
            >
              Clear search
            </button>
          </p>
        </div>
      )}

      {/* Deals Grid */}
      {filteredDeals.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">ðŸ˜”</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No deals found
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'Try a different search term' : 'No deals available in this category'}
          </p>
          {(searchTerm || selectedCategory !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Show All Deals
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDeals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              onFavoriteToggle={handleFavoriteToggle}
              isFavorite={isFavorite(deal.id)}
            />
          ))}
        </div>
      )}

      {/* How It Works Section */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          How Customizable Deals Work
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-3xl mb-4">1</div>
            <h3 className="font-bold text-lg mb-2">Select Your Deal</h3>
            <p className="text-gray-600">
              Choose from pizza, burger, or combo deals. Look for the "Customize" button.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-3xl mb-4">2</div>
            <h3 className="font-bold text-lg mb-2">Personalize Your Order</h3>
            <p className="text-gray-600">
              Customize sizes, crusts, toppings, addons, and quantity to match your preferences.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-3xl mb-4">3</div>
            <h3 className="font-bold text-lg mb-2">Add to Cart & Checkout</h3>
            <p className="text-gray-600">
              Review your customized deal and add to cart. Proceed to checkout when ready.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


