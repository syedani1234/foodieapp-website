import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CartProvider } from "./features/cart/store/CartContext";
import { FavoritesProvider } from "./features/favorites/store/FavoritesContext";
import Navbar from "./features/shared/components/Navbar";
import { Footer } from "./features/shared/components/Footer";

// Pages
import { HomePage } from "./features/shared/pages/HomePage";
import { DealsPage } from "./features/deals/pages/DealsPage";
import { FavoritesPage } from "./features/favorites/pages/FavoritesPage";
import { CuisinesPage } from "./features/cuisines/pages/CuisinePage";
import CuisineFilterPage from "./features/cuisines/pages/CuisineFilterPage";
import RestaurantPage from "./features/restaurants/pages/RestaurantPage";
import RestaurantDetailsPage from "./features/restaurants/pages/RestaurantDetailsPage";
import CartPage from "./features/cart/pages/CartPage";
import CheckoutPage from "./features/cart/pages/CheckoutPage";
import OrderConfirmationPage from "./features/orders/pages/OrderConfirmationPage";
import TrackOrderPage from "./features/orders/pages/TrackOrderPage";

import "./index.css";

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <FavoritesProvider>
          <Router>
            <div className="flex flex-col min-h-screen bg-gray-50">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/deals" element={<DealsPage />} />
                  <Route path="/favorites" element={<FavoritesPage />} />
                  <Route path="/cuisines" element={<CuisinesPage />} />
                  <Route path="/cuisines/:cuisine" element={<CuisineFilterPage />} />
                  <Route path="/restaurants" element={<RestaurantPage />} />
                  <Route path="/restaurants/:id" element={<RestaurantDetailsPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
                  <Route path="/track-order/:orderId" element={<TrackOrderPage />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </Router>
        </FavoritesProvider>
      </CartProvider>
    </QueryClientProvider>
  );
}