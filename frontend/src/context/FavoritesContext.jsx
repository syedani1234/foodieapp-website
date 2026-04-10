import { createContext, useContext, useState, useEffect } from "react";
import { useFavoritesStore } from "../store/FavoritesStore"; // Added .js extension

const FavoritesContext = createContext();

export const FavoritesProvider = ({ children }) => {
  // Use Zustand store as the source of truth
  const favoritesStore = useFavoritesStore();

  // For backward compatibility, maintain local state
  const [favorites, setFavorites] = useState([]);

  // Sync with Zustand store
  useEffect(() => {
    setFavorites(favoritesStore.favorites);
  }, [favoritesStore.favorites]);

  const addToFavorites = (item) => {
    // Determine type based on item properties
    let type = "item";
    if (item.cuisine_name) type = "cuisine";
    else if (item.restaurant_id) type = "restaurant";
    else if (item.discount_price) type = "deal";
    else if (item.base_price) type = "dish";

    favoritesStore.addFavorite(item, type);
  };

  const removeFromFavorites = (id) => {
    // Try to find the item to determine type
    const favorite = favoritesStore.favorites.find((f) => f.id === id);
    if (favorite) {
      favoritesStore.removeFavorite(id, favorite.type);
    } else {
      // If not found, try all types
      favoritesStore.removeFavorite(id, "item");
      favoritesStore.removeFavorite(id, "restaurant");
      favoritesStore.removeFavorite(id, "cuisine");
      favoritesStore.removeFavorite(id, "deal");
      favoritesStore.removeFavorite(id, "dish");
    }
  };

  const isFavorite = (id) => {
    // Check all types
    return (
      favoritesStore.isFavorite(id, "item") ||
      favoritesStore.isFavorite(id, "restaurant") ||
      favoritesStore.isFavorite(id, "cuisine") ||
      favoritesStore.isFavorite(id, "deal") ||
      favoritesStore.isFavorite(id, "dish")
    );
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => useContext(FavoritesContext);
