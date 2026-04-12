// src/pages/FavoritesPage.jsx
import { useFavorites } from "../context/FavoritesContext";
import { Link } from "react-router-dom";

export const FavoritesPage = () => {
  const { favorites, removeFromFavorites } = useFavorites();

  if (favorites.length === 0) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-pink-600">⭐ Your Favorites</h2>
        <p className="text-gray-600">
          No favorites yet. Add some from restaurants, deals, or cuisines!
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-pink-600">⭐ Your Favorites</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {favorites.map((fav) => (
          <div
            key={`${fav.type}-${fav.id}`}
            className="border rounded-lg shadow hover:shadow-lg transition flex flex-col"
          >
            <img
              src={fav.image || "/images/placeholder.jpg"}
              alt={fav.name || fav.title}
              className="w-full h-40 object-cover rounded-t-lg"
            />

            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-lg">{fav.name || fav.title}</h3>
                <p className="text-sm text-gray-500">({fav.type})</p>
                {fav.price && <p className="text-gray-700 mt-1">Rs. {fav.price}</p>}
                {fav.restaurant && <p className="text-gray-500 text-sm mt-1">📍 {fav.restaurant}</p>}
              </div>

              <div className="mt-4">
                <button
                  onClick={() => removeFromFavorites(fav.id)}
                  className="w-full bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                >
                  ❌ Remove
                </button>

                {/* Optional: link to restaurant or deal page */}
                {fav.type === "restaurant" && (
                  <Link
                    to={`/restaurants/${fav.id}`}
                    className="block mt-2 text-center text-blue-500 hover:underline"
                  >
                    View Restaurant
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};