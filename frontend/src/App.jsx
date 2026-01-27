import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CartProvider } from "./context/CartContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import Navbar from "./components/Navbar";
import { Footer } from "./components/Footer";

// Pages
import { HomePage } from "./pages/HomePage";
import { DealsPage } from "./pages/DealsPage";
import { FavoritesPage } from "./pages/FavoritesPage";
import { CuisinesPage } from "./pages/CuisinePage";
import CuisineFilterPage from "./pages/CuisineFilterPage";
import RestaurantPage from "./pages/RestaurantPage";
import RestaurantDetailsPage from "./pages/RestaurantDetailsPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import TrackOrderPage from "./pages/TrackOrderPage";

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
              {/* âœ… Navbar */}
              <Navbar />

              {/* âœ… Main Content */}
              <main className="flex-1">
                <Routes>
                  {/* ðŸ  Home & General Pages */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/deals" element={<DealsPage />} />
                  <Route path="/favorites" element={<FavoritesPage />} />

                  {/* ðŸ½ï¸ Cuisines */}
                  <Route path="/cuisines" element={<CuisinesPage />} />
                  <Route path="/cuisines/:cuisine" element={<CuisineFilterPage />} />

                  {/* ðŸ¢ Restaurants */}
                  <Route path="/restaurants" element={<RestaurantPage />} />
                  <Route path="/restaurants/:id" element={<RestaurantDetailsPage />} />

                  {/* ðŸ›’ Cart & Checkout */}
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />

                  {/* âœ… Order Confirmation (dynamic order ID) */}
                  <Route
                    path="/order-confirmation/:orderId"
                    element={<OrderConfirmationPage />}
                  />

                  {/* ðŸšš Track Order (dynamic order ID) */}
                  <Route
                    path="/track-order/:orderId"
                    element={<TrackOrderPage />}
                  />
                </Routes>
              </main>

              {/* âœ… Footer */}
              <Footer />
            </div>
          </Router>
        </FavoritesProvider>
      </CartProvider>
    </QueryClientProvider>
  );
}


