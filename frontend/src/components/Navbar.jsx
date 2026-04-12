import { Link, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useState } from "react";

export default function Navbar() {
  const { cartItems } = useCart();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();

  // List of cuisines
  const cuisines = ["Italian", "Fast Food", "Indian"];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-black shadow-md sticky top-0 z-50">
      <nav className="max-w-6xl mx-auto flex justify-between items-center px-6 py-4 text-white">
        
        {/* Logo / Brand */}
        <Link
          to="/"
          className="text-2xl font-bold text-blue-500 hover:text-blue-400"
        >
          🍴 FoodieApp
        </Link>

        {/* Navigation Links */}
        <div className="flex gap-6 items-center relative">
          <Link
            to="/"
            className={`hover:text-blue-400 ${isActive("/") ? "text-blue-400 font-semibold" : ""}`}
          >
            Home
          </Link>

          <Link
            to="/deals"
            className={`hover:text-blue-400 ${isActive("/deals") ? "text-blue-400 font-semibold" : ""}`}
          >
            Deals
          </Link>

          <Link
            to="/favorites"
            className={`hover:text-blue-400 ${isActive("/favorites") ? "text-blue-400 font-semibold" : ""}`}
          >
            Favorites
          </Link>

          {/* Dropdown for Cuisines */}
          <div
            className="relative"
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <button
              className="hover:text-blue-400 flex items-center gap-1"
            >
              Cuisines ▼
            </button>
            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white text-black rounded shadow-lg w-40 z-50">
                {cuisines.map((cuisine) => (
                  <Link
                    key={cuisine}
                    to={`/cuisines/${cuisine.toLowerCase()}`}
                    className="block px-4 py-2 hover:bg-gray-200"
                  >
                    {cuisine}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/restaurants"
            className={`hover:text-blue-400 ${isActive("/restaurants") ? "text-blue-400 font-semibold" : ""}`}
          >
            Restaurants
          </Link>
        </div>

        {/* Cart Button with Badge */}
        <Link
          to="/cart"
          className="relative bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          🛒 Cart
          {cartItems.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
              {cartItems.length}
            </span>
          )}
        </Link>
      </nav>
    </header>
  );
};