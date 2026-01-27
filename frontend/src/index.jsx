import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CartProvider } from "./context/CartContext";  // âœ… import our Cart context
import "./index.css"; // Tailwind

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <CartProvider>   {/* âœ… wrap App inside CartProvider */}
        <App />
      </CartProvider>
    </QueryClientProvider>
  </React.StrictMode>
);


