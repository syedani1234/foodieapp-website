import { create } from "zustand";

const useAppStore = create((set) => ({
  location: "Islamabad",
  setLocation: (newLocation) => set({ location: newLocation }),
  favorites: [],
  addFavorite: (restaurant) =>
    set((state) => ({ favorites: [...state.favorites, restaurant] })),
}));

export default useAppStore;


