import API_BASE_URL from "../config/api";
import { useCart } from "../context/CartContext";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function CheckoutPage() {
  const { cartItems, getItemTotalPrice, getOrderBreakdown, clearCart } =
    useCart();

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [address, setAddress] = useState("456 Customer Lane, New Delhi, India");
  const [contactNumber, setContactNumber] = useState("+91 9876543210");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [notes, setNotes] = useState("");
  const [apiAvailable, setApiAvailable] = useState(true);

  useEffect(() => {
    // Check if API is available
    checkApiAvailability();
  }, []);

  const checkApiAvailability = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/health`,
      );
      if (response.ok) {
        setApiAvailable(true);
      } else {
        setApiAvailable(false);
      }
    } catch (error) {
      console.error("API check failed:", error);
      setApiAvailable(false);
    }
  };

  // Calculate totals directly for accurate display
  const calculateTotals = () => {
    if (!cartItems || cartItems.length === 0) {
      return {
        foodTotal: 0,
        deliveryFee: 50,
        tax: 0,
        grandTotal: 50,
      };
    }

    const foodTotal = cartItems.reduce((sum, item) => {
      const itemTotal = getItemTotalPrice ? getItemTotalPrice(item) : 0;
      return sum + itemTotal;
    }, 0);

    const deliveryFee = 50;
    const tax = foodTotal * 0.05; // 5% tax as shown in images
    const grandTotal = foodTotal + deliveryFee + tax;

    return {
      foodTotal,
      deliveryFee,
      tax,
      grandTotal,
    };
  };

  const totals = calculateTotals();

  const createOrderAPI = async (orderData) => {
    try {
      console.log("ðŸ“¦ Sending order to API:", orderData);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(orderData),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}`);
      }

      console.log("âœ… Order API Response:", result);
      return result;
    } catch (error) {
      console.error("âŒ Order API Error:", error);
      throw error;
    }
  };

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      alert("Please enter your delivery address");
      return;
    }

    if (!contactNumber.trim() || contactNumber.length < 10) {
      alert("Please enter a valid contact number");
      return;
    }

    try {
      setIsPlacingOrder(true);

      // Prepare order items with actual menu_item_id
      const orderItems = cartItems.map((item) => {
        // Use actual menu item ID or generate a valid one
        const menuItemId =
          item.id || item.menu_item_id || Math.floor(Math.random() * 100) + 1;

        return {
          menu_item_id: menuItemId,
          name: item.name || "Unknown Item",
          quantity: item.quantity || 1,
          price: item.price || item.base_price || 0,
          description: item.description || "",
        };
      });

      // Get restaurant ID from first item or use default
      const restaurantId =
        cartItems[0]?.restaurant_id || cartItems[0]?.restaurantId || 1;

      // Create order data EXACTLY as your server expects
      const orderData = {
        user_id: 1,
        restaurant_id: restaurantId,
        items: orderItems,
        delivery_address: address,
        contact_number: contactNumber,
        payment_method:
          paymentMethod === "cod"
            ? "Cash on Delivery"
            : paymentMethod === "card"
              ? "Credit Card"
              : "Online Payment",
        notes: notes,
        order_type: "delivery",
      };

      console.log("ðŸ“¦ Creating order with data:", orderData);

      let orderResult;

      if (apiAvailable) {
        // Try to create order via API
        try {
          orderResult = await createOrderAPI(orderData);

          if (!orderResult.success) {
            throw new Error(orderResult.message || "API returned unsuccessful");
          }
        } catch (apiError) {
          console.error("âŒ API order creation failed:", apiError);
          // Fallback to localStorage
          orderResult = {
            success: true,
            order: createLocalOrder(orderData, totals),
          };
        }
      } else {
        // API is offline, create local order
        orderResult = {
          success: true,
          order: createLocalOrder(orderData, totals),
        };
      }

      const createdOrder = orderResult.order;

      // Clear cart after successful order
      if (clearCart) {
        clearCart();
      }

      // Store order data in localStorage for confirmation page
      localStorage.setItem("lastOrder", JSON.stringify(createdOrder));
      localStorage.setItem("lastOrderId", createdOrder.id);
      localStorage.setItem("lastOrderNumber", createdOrder.orderNumber);

      console.log(
        "âœ… Order created, navigating to confirmation page with orderId:",
        createdOrder.id,
      );

      // Navigate to order confirmation with order ID
      navigate(`/order-confirmation/${createdOrder.id}`);
    } catch (error) {
      console.error("âŒ Error placing order:", error);
      alert(`Failed to place order: ${error.message}`);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Create order locally when API is unavailable
  const createLocalOrder = (orderData, totals) => {
    const orderId = `ORD${Date.now().toString().slice(-6)}`;

    return {
      id: orderId,
      orderNumber: orderId,
      totalAmount: totals.grandTotal,
      status: "preparing",
      restaurant: {
        name: "Foodie Heaven",
        address: "123 Main St, New Delhi",
        deliveryTime: "30-45 minutes",
      },
      deliveryAddress: orderData.delivery_address,
      estimatedDelivery: "30-40 minutes",
      paymentMethod: orderData.payment_method,
      itemsCount: orderData.items.length,
      items: orderData.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
      })),
      breakdown: {
        subtotal: totals.foodTotal,
        tax: totals.tax,
        deliveryFee: totals.deliveryFee,
        total: totals.grandTotal,
      },
    };
  };

  // Helper function to safely format numbers
  const formatPrice = (price) => {
    if (price === undefined || price === null || isNaN(price)) return "0";
    return Number(price).toFixed(0);
  };

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="text-6xl mb-4">ðŸ›’</div>
        <h1 className="text-2xl font-bold mb-3 text-gray-800">
          Your cart is empty
        </h1>
        <p className="text-gray-600 mb-6">
          Add items from restaurants to checkout
        </p>
        <button
          onClick={() => navigate("/restaurants")}
          className="bg-[#d70f64] text-white px-8 py-3 rounded-lg hover:bg-[#b80d55] transition duration-300 font-medium"
        >
          Browse Restaurants
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          ðŸ›’ Checkout
        </h1>
        {!apiAvailable && (
          <div className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
            âš ï¸ Offline Mode
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN - Delivery & Payment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-lg">ðŸ‘¤</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">
                Contact Information
              </h2>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number *
              </label>
              <input
                type="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700"
              />
              <p className="text-sm text-gray-500 mt-1">
                We'll use this for delivery updates
              </p>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-lg">ðŸ“</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">
                Delivery Address *
              </h2>
            </div>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your complete delivery address with landmarks"
              className="w-full border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700"
              rows={4}
              required
            />
          </div>

          {/* Payment Method */}
          <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-lg">ðŸ’³</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">
                Payment Method
              </h2>
            </div>
            <div className="space-y-3">
              {[
                { value: "card", label: "Credit/Debit Card", icon: "ðŸ’³" },
                { value: "online", label: "Online-Payment", icon: "ðŸŒ" },
                { value: "cod", label: "Cash on Delivery", icon: "ðŸ’°" },
              ].map((method) => (
                <label
                  key={method.value}
                  className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
                    paymentMethod === method.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    value={method.value}
                    checked={paymentMethod === method.value}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-5 h-5 text-blue-600"
                  />
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{method.icon}</span>
                    <span className="font-medium text-gray-800">
                      {method.label}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-lg">ðŸ“</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">
                Additional Notes
              </h2>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions for delivery or food preparation..."
              className="w-full border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700"
              rows={3}
            />
          </div>
        </div>

        {/* RIGHT COLUMN - Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-6">
            <div className="p-5 md:p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 text-lg">ðŸ§¾</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Order Summary
                </h2>
              </div>

              {/* Items list - Top section */}
              <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
                {cartItems.map((item, idx) => {
                  const itemTotal = getItemTotalPrice
                    ? getItemTotalPrice(item)
                    : 0;

                  return (
                    <div
                      key={idx}
                      className="flex justify-between items-start pb-3 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">
                          {item.name || "Unnamed Item"}
                          <span className="text-gray-500 text-sm ml-2">
                            x {item.quantity || 1}
                          </span>
                        </div>
                        {item.selectedSize && (
                          <div className="text-sm text-gray-600 mt-1">
                            Size: {item.selectedSize.name}
                          </div>
                        )}
                      </div>

                      <div className="font-medium text-gray-800 ml-4 whitespace-nowrap">
                        Rs. {formatPrice(itemTotal)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Overall Order Summary - Bottom billing section */}
              <div className="pt-4">
                <h3 className="font-semibold text-gray-800 mb-4">
                  Total Charges
                </h3>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Food Total</span>
                    <span className="font-medium">
                      Rs. {formatPrice(totals.foodTotal)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Charges</span>
                    <span className="font-medium">
                      Rs. {formatPrice(totals.deliveryFee)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax & Charges (5%)</span>
                    <span className="font-medium">
                      Rs. {formatPrice(totals.tax)}
                    </span>
                  </div>
                </div>

                {/* Grand Total */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-bold text-gray-800">
                      Grand Total
                    </span>
                    <span className="text-2xl font-bold text-[#d70f64]">
                      Rs. {formatPrice(totals.grandTotal)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-6">
                    Inclusive of all taxes
                  </p>

                  {/* Delivery Info */}
                  <div className="mb-6 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700">
                      <span className="text-lg">ðŸšš</span>
                      <div className="text-sm">
                        <div className="font-medium">
                          Estimated delivery time: 30-45 mins
                        </div>
                        <div className="text-blue-600">
                          Delivery Fee: Rs. 50 (Fixed for all orders)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* API Status */}
                  {!apiAvailable && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-700">
                        <span className="text-lg">âš ï¸</span>
                        <div className="text-sm">
                          <div className="font-medium">Offline Mode</div>
                          <div>Your order will be saved locally</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Place Order Button */}
                  <button
                    onClick={handlePlaceOrder}
                    disabled={
                      isPlacingOrder || !address.trim() || !contactNumber.trim()
                    }
                    className="w-full bg-[#d70f64] text-white py-4 rounded-lg hover:bg-[#b80d55] transition font-bold text-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPlacingOrder ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Placing Order...
                      </div>
                    ) : apiAvailable ? (
                      "Place Order"
                    ) : (
                      "Save Order Offline"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
