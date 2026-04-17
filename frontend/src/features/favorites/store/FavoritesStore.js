   // src/store/favoritesStore.js
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Item types for categorization
export const FAVORITE_TYPES = {
  CUISINE: 'cuisine',
  RESTAURANT: 'restaurant',
  DISH: 'dish',
  DEAL: 'deal',
};

// Default favorite categories
const DEFAULT_CATEGORIES = [
  { id: 'all', name: 'All Favorites', type: null },
  { id: 'restaurants', name: 'Restaurants', type: FAVORITE_TYPES.RESTAURANT },
  { id: 'dishes', name: 'Dishes', type: FAVORITE_TYPES.DISH },
  { id: 'cuisines', name: 'Cuisines', type: FAVORITE_TYPES.CUISINE },
  { id: 'deals', name: 'Deals', type: FAVORITE_TYPES.DEAL },
];

export const useFavoritesStore = create(
  persist(
    (set, get) => ({
      // State
      favorites: [],
      selectedCategory: 'all',
      customCategories: [],
      
      // Getters
      getFavoriteById: (id, type) => {
        return get().favorites.find(fav => fav.id === id && fav.type === type);
      },
      
      isFavorite: (id, type) => {
        return get().favorites.some(fav => fav.id === id && fav.type === type);
      },
      
      getFavoritesByType: (type) => {
        if (type === 'all') return get().favorites;
        return get().favorites.filter(fav => fav.type === type);
      },
      
      getFavoritesByCategory: (categoryId) => {
        if (categoryId === 'all') return get().favorites;
        
        const category = [...DEFAULT_CATEGORIES, ...get().customCategories]
          .find(cat => cat.id === categoryId);
        
        if (!category) return [];
        
        if (category.type) {
          return get().favorites.filter(fav => fav.type === category.type);
        }
        
        // For custom categories that have specific items
        return get().favorites.filter(fav => 
          fav.categories?.includes(categoryId)
        );
      },
      
      getFavoritesCount: () => get().favorites.length,
      
      getFavoritesByTypeCount: (type) => {
        return get().favorites.filter(fav => fav.type === type).length;
      },
      
      getCategories: () => {
        return [
          ...DEFAULT_CATEGORIES.map(cat => ({
            ...cat,
            count: cat.type ? 
              get().getFavoritesByTypeCount(cat.type) : 
              get().getFavoritesCount()
          })),
          ...get().customCategories.map(cat => ({
            ...cat,
            count: get().favorites.filter(fav => 
              fav.categories?.includes(cat.id)
            ).length
          }))
        ];
      },
      
      // Actions
      addFavorite: (item, type, categories = []) => {
        const { favorites } = get();
        const exists = favorites.some(
          (f) => f.id === item.id && f.type === type
        );
        
        if (exists) {
          // Update existing favorite with additional categories
          set({
            favorites: favorites.map(fav => 
              fav.id === item.id && fav.type === type
                ? { 
                    ...fav, 
                    categories: Array.from(new Set([...fav.categories || [], ...categories])),
                    updatedAt: new Date().toISOString()
                  }
                : fav
            )
          });
          return;
        }
        
        const newFavorite = {
          ...item,
          type,
          categories,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        set({ favorites: [...favorites, newFavorite] });
      },
      
      removeFavorite: (id, type) => {
        set((state) => ({
          favorites: state.favorites.filter(
            (f) => !(f.id === id && f.type === type)
          ),
        }));
      },
      
      toggleFavorite: (item, type, categories = []) => {
        const { isFavorite } = get();
        const isCurrentlyFavorite = isFavorite(item.id, type);
        
        if (isCurrentlyFavorite) {
          get().removeFavorite(item.id, type);
        } else {
          get().addFavorite(item, type, categories);
        }
        
        return !isCurrentlyFavorite;
      },
      
      updateFavorite: (id, type, updates) => {
        set((state) => ({
          favorites: state.favorites.map((favorite) =>
            favorite.id === id && favorite.type === type
              ? { ...favorite, ...updates, updatedAt: new Date().toISOString() }
              : favorite
          ),
        }));
      },
      
      addToFavoriteCategories: (id, type, categoryIds) => {
        set((state) => ({
          favorites: state.favorites.map((favorite) =>
            favorite.id === id && favorite.type === type
              ? {
                  ...favorite,
                  categories: Array.from(
                    new Set([...(favorite.categories || []), ...categoryIds])
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : favorite
          ),
        }));
      },
      
      removeFromFavoriteCategories: (id, type, categoryId) => {
        set((state) => ({
          favorites: state.favorites.map((favorite) =>
            favorite.id === id && favorite.type === type
              ? {
                  ...favorite,
                  categories: (favorite.categories || []).filter(
                    (cat) => cat !== categoryId
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : favorite
          ),
        }));
      },
      
      createCustomCategory: (name) => {
        const id = `custom-${Date.now()}`;
        set((state) => ({
          customCategories: [
            ...state.customCategories,
            { id, name, type: null }
          ],
        }));
        return id;
      },
      
      updateCustomCategory: (id, name) => {
        set((state) => ({
          customCategories: state.customCategories.map((cat) =>
            cat.id === id ? { ...cat, name } : cat
          ),
        }));
      },
      
      deleteCustomCategory: (id) => {
        // Remove category from all favorites first
        set((state) => ({
          favorites: state.favorites.map(favorite => ({
            ...favorite,
            categories: (favorite.categories || []).filter(cat => cat !== id)
          })),
          customCategories: state.customCategories.filter(cat => cat.id !== id)
        }));
      },
      
      setSelectedCategory: (categoryId) => {
        set({ selectedCategory: categoryId });
      },
      
      clearFavorites: () => set({ favorites: [] }),
      
      clearFavoritesByType: (type) => {
        set((state) => ({
          favorites: state.favorites.filter((f) => f.type !== type),
        }));
      },
      
      exportFavorites: () => {
        const { favorites } = get();
        const dataStr = JSON.stringify(favorites, null, 2);
        const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
        
        return {
          data: favorites,
          downloadUrl: dataUri,
          count: favorites.length
        };
      },
      
      importFavorites: (favoritesArray) => {
        const validFavorites = favoritesArray.filter(fav => 
          fav && fav.id && fav.type && Object.values(FAVORITE_TYPES).includes(fav.type)
        );
        
        set((state) => {
          // Merge with existing favorites, avoiding duplicates
          const existingIds = new Set(
            state.favorites.map(f => `${f.id}-${f.type}`)
          );
          
          const newFavorites = validFavorites.filter(
            fav => !existingIds.has(`${fav.id}-${fav.type}`)
          );
          
          return {
            favorites: [
              ...state.favorites,
              ...newFavorites.map(fav => ({
                ...fav,
                createdAt: fav.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }))
            ]
          };
        });
        
        return validFavorites.length;
      },
      
      // Search functionality
      searchFavorites: (searchTerm) => {
        const term = searchTerm.toLowerCase();
        return get().favorites.filter(favorite =>
          favorite.name?.toLowerCase().includes(term) ||
          favorite.title?.toLowerCase().includes(term) ||
          favorite.description?.toLowerCase().includes(term) ||
          favorite.type?.toLowerCase().includes(term)
        );
      },
      
      // Recent favorites
      getRecentFavorites: (limit = 10) => {
        return get().favorites
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, limit);
      },
      
      // Popular favorites (based on most added)
      getMostAddedFavorites: (limit = 5) => {
        // In a real app, you might track this differently
        return get().favorites.slice(0, limit);
      },
    }),
    {
      name: "food-app-favorites-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        favorites: state.favorites,
        customCategories: state.customCategories,
        selectedCategory: state.selectedCategory
      }),
      version: 1, // Useful for migrations
      migrate: (persistedState, version) => {
        if (version === 0) {
          // Migration from v0 to v1
          return {
            ...persistedState,
            favorites: (persistedState.favorites || []).map(fav => ({
              ...fav,
              categories: fav.categories || [],
              createdAt: fav.createdAt || new Date().toISOString(),
              updatedAt: fav.updatedAt || new Date().toISOString()
            })),
            customCategories: persistedState.customCategories || [],
            selectedCategory: persistedState.selectedCategory || 'all'
          };
        }
        return persistedState;
      },
    }
  )
);

// Helper hook for common favorite operations
export const useFavoriteActions = () => {
  const store = useFavoritesStore();
  
  return {
    // Quick access methods
    addRestaurant: (restaurant) => 
      store.addFavorite(restaurant, FAVORITE_TYPES.RESTAURANT),
    
    addDish: (dish) => 
      store.addFavorite(dish, FAVORITE_TYPES.DISH),
    
    addCuisine: (cuisine) => 
      store.addFavorite(cuisine, FAVORITE_TYPES.CUISINE),
    
    addDeal: (deal) => 
      store.addFavorite(deal, FAVORITE_TYPES.DEAL),
    
    // Quick toggle methods
    toggleRestaurant: (restaurant) => 
      store.toggleFavorite(restaurant, FAVORITE_TYPES.RESTAURANT),
    
    toggleDish: (dish) => 
      store.toggleFavorite(dish, FAVORITE_TYPES.DISH),
    
    toggleCuisine: (cuisine) => 
      store.toggleFavorite(cuisine, FAVORITE_TYPES.CUISINE),
    
    toggleDeal: (deal) => 
      store.toggleFavorite(deal, FAVORITE_TYPES.DEAL),
    
    // Quick check methods
    isRestaurantFavorite: (id) => 
      store.isFavorite(id, FAVORITE_TYPES.RESTAURANT),
    
    isDishFavorite: (id) => 
      store.isFavorite(id, FAVORITE_TYPES.DISH),
    
    isCuisineFavorite: (id) => 
      store.isFavorite(id, FAVORITE_TYPES.CUISINE),
    
    isDealFavorite: (id) => 
      store.isFavorite(id, FAVORITE_TYPES.DEAL),
  };
};


