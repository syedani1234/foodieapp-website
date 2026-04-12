import { useState } from "react";
import { useCart } from "../context/CartContext";
import { Link, useNavigate } from "react-router-dom";
import MenuModal from "../components/MenuModal";

export default function CartPage() {
  const navigate = useNavigate();
  const { 
    cartItems, 
    updateCartItem, 
    removeFromCart, 
    clearCart,
    addToCart,
    getItemTotalPrice,
    getItemBasePrice,
    getToppingsDisplayInfo,
    getOrderBreakdown
  } = useCart();
  
  const [modalItem, setModalItem] = useState(null);
  const [modalItemIndex, setModalItemIndex] = useState(null);

  // Get order breakdown
  const orderBreakdown = getOrderBreakdown ? getOrderBreakdown() : {
    subtotal: 0,
    tax: 0,
    total: 0
  };

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center mt-20">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="text-2xl font-bold mb-3 text-gray-800">Your cart is empty</h1>
        <p className="text-gray-600 mb-6">Add items to get started</p>
        <Link
          to="/restaurants"
          className="inline-block bg-[#d70f64] text-white px-8 py-3 rounded-lg hover:bg-[#b80d55] transition duration-300 font-medium"
        >
          See restaurants near you
        </Link>
      </div>
    );
  }

  const handleEditItem = (item, index) => {
    setModalItem(item);
    setModalItemIndex(index);
  };

  const handleModalAddToCart = (updatedItem) => {
    if (modalItemIndex !== null) {
      updateCartItem(modalItemIndex, updatedItem);
    } else {
      addToCart(updatedItem);
    }
    setModalItem(null);
    setModalItemIndex(null);
  };

  // Helper to format price
  const formatPrice = (price) => {
    if (price === undefined || price === null || isNaN(price)) return "0";
    return Number(price).toFixed(0);
  };

  // Calculate subtotal from all items
  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => {
      const itemTotal = getItemTotalPrice ? getItemTotalPrice(item) : (item.itemTotal || 0);
      return sum + itemTotal;
    }, 0);
  };

  // Calculate tax (5%)
  const calculateTax = (subtotal) => {
    return subtotal * 0.05;
  };

  // Calculate total
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    return subtotal + tax;
  };

  // Get price breakdown for an item
  const getItemPriceBreakdown = (item) => {
    const basePrice = getItemBasePrice ? getItemBasePrice(item) : (item.base_price || item.price || 0);
    const totalPrice = getItemTotalPrice ? getItemTotalPrice(item) : (item.itemTotal || 0);
    const quantity = item.quantity || 1;
    const pricePerUnit = totalPrice / quantity;
    const extrasPrice = Math.max(0, pricePerUnit - basePrice);
    
    return {
      basePrice: basePrice * quantity,
      extrasPrice: extrasPrice * quantity,
      pricePerUnit,
      totalPrice,
      quantity
    };
  };

  // Get total base price
  const getTotalBasePrice = () => {
    return cartItems.reduce((sum, item) => {
      const breakdown = getItemPriceBreakdown(item);
      return sum + breakdown.basePrice;
    }, 0);
  };

  // Get total extras price
  const getTotalExtrasPrice = () => {
    return cartItems.reduce((sum, item) => {
      const breakdown = getItemPriceBreakdown(item);
      return sum + breakdown.extrasPrice;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const tax = calculateTax(subtotal);
  const total = calculateTotal();
  const totalBasePrice = getTotalBasePrice();
  const totalExtrasPrice = getTotalExtrasPrice();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Your Order Summary</h1>
          <p className="text-gray-600 mt-2">
            {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Cart Items */}
          <div className="lg:w-2/3">
            {cartItems.map((item, index) => {
              const priceBreakdown = getItemPriceBreakdown(item);
              const toppingsInfo = getToppingsDisplayInfo ? getToppingsDisplayInfo(item) : { names: "", price: 0 };
              
              return (
                <div
                  key={`${item.id}-${index}-${item.updatedAt || index}`}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{item.name}</h3>
                        <div className="mt-2">
                          <span className="text-lg font-bold text-gray-800">
                            Rs. {formatPrice(priceBreakdown.pricePerUnit)}
                          </span>
                          <span className="text-gray-500 ml-1">/ item</span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(index)}
                        className="text-gray-400 hover:text-red-500 text-xl"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Item Details */}
                    <div className="space-y-2 text-gray-600 text-sm bg-gray-50 p-4 rounded-lg">
                      {/* Size */}
                      {item.selectedSize && item.selectedSize !== "medium" && (
                        <div className="flex justify-between items-center">
                          <span className="font-medium w-32">Size:</span>
                          <span className="capitalize flex-1">{item.selectedSize}</span>
                          {item.selectedSizePrice > 0 && (
                            <span className="text-green-600 font-medium">
                              +Rs.{formatPrice(item.selectedSizePrice)}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Variations */}
                      {item.selectedVariations && Object.keys(item.selectedVariations).length > 0 && (
                        <div className="space-y-1">
                          {Object.values(item.selectedVariations).map((variation, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="font-medium w-32">
                                {idx === 0 ? "Variation:" : ""}
                              </span>
                              <span className="flex-1">{variation.label || variation.name}</span>
                              {variation.price > 0 && (
                                <span className="text-green-600 font-medium">
                                  +Rs.{formatPrice(variation.price)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Deal Options */}
                      {item.selectedDealOptions && Object.keys(item.selectedDealOptions).length > 0 && (
                        <div className="space-y-1">
                          {Object.values(item.selectedDealOptions).map((option, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="font-medium w-32">
                                {idx === 0 ? "Option:" : ""}
                              </span>
                              <span className="flex-1">{option.name || option.label}</span>
                              {option.price > 0 && (
                                <span className="text-green-600 font-medium">
                                  +Rs.{formatPrice(option.price)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Toppings */}
                      {item.selectedToppings && item.selectedToppings.length > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="font-medium w-32">Toppings:</span>
                          <span className="flex-1">{toppingsInfo.names}</span>
                          {toppingsInfo.price > 0 && (
                            <span className="text-green-600 font-medium">
                              +Rs.{formatPrice(toppingsInfo.price)}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Add-ons */}
                      {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                        <div className="space-y-1">
                          {item.selectedAddOns.map((addOn, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="font-medium w-32">
                                {idx === 0 ? "Add-ons:" : ""}
                              </span>
                              <span className="flex-1">{addOn.name || addOn.label}</span>
                              {addOn.price > 0 && (
                                <span className="text-green-600 font-medium">
                                  +Rs.{formatPrice(addOn.price)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Crust */}
                      {item.selectedCrust && (
                        <div className="flex justify-between items-center">
                          <span className="font-medium w-32">Crust:</span>
                          <span className="flex-1">{item.selectedCrust.name || item.selectedCrust.label}</span>
                          {item.selectedCrust.price > 0 && (
                            <span className="text-green-600 font-medium">
                              +Rs.{formatPrice(item.selectedCrust.price)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quantity and Total */}
                    <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-6 border-t border-gray-100">
                      <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                        <span className="font-medium text-gray-700">Quantity:</span>
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() => {
                              if (item.quantity > 1) {
                                updateCartItem(index, {
                                  ...item,
                                  quantity: item.quantity - 1,
                                  updatedAt: Date.now()
                                });
                              } else {
                                removeFromCart(index);
                              }
                            }}
                            className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-l-lg disabled:opacity-30 disabled:cursor-not-allowed"
                            disabled={item.quantity <= 1}
                          >
                            <span className="text-xl">−</span>
                          </button>
                          <span className="w-12 text-center font-bold text-gray-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateCartItem(index, {
                                ...item,
                                quantity: item.quantity + 1,
                                updatedAt: Date.now()
                              })
                            }
                            className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-r-lg"
                          >
                            <span className="text-xl">+</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Item Total</div>
                          <div className="text-2xl font-bold text-gray-800">
                            Rs. {formatPrice(priceBreakdown.totalPrice)}
                          </div>
                        </div>
                        <button
                          onClick={() => handleEditItem(item, index)}
                          className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Continue Shopping Button */}
            <div className="mt-6">
              <Link
                to="/restaurants"
                className="inline-flex items-center text-[#d70f64] hover:text-[#b80d55] font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-8">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Price Details</h2>

                {/* Items Total */}
                <div className="space-y-4 mb-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-700">Items Total</span>
                      <span className="font-medium">Rs. {formatPrice(subtotal)}</span>
                    </div>
                    
                    {/* Breakdown */}
                    <div className="pl-4 space-y-1 text-sm text-gray-500">
                      <div className="flex justify-between">
                        <span>• Base Price</span>
                        <span>Rs. {formatPrice(totalBasePrice)}</span>
                      </div>
                      {totalExtrasPrice > 0 && (
                        <div className="flex justify-between">
                          <span>• Extras & Modifications</span>
                          <span>Rs. {formatPrice(totalExtrasPrice)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tax */}
                  <div className="flex justify-between pt-4 border-t border-gray-100">
                    <span className="text-gray-700">Tax (5%)</span>
                    <span className="font-medium">Rs. {formatPrice(tax)}</span>
                  </div>
                </div>

                {/* Grand Total */}
                <div className="pt-6 border-t border-gray-200">
                  <div className="flex justify-between mb-4">
                    <span className="text-xl font-bold text-gray-800">Grand Total</span>
                    <span className="text-2xl font-bold text-[#d70f64]">
                      Rs. {formatPrice(total)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-6">
                    All taxes included. No hidden charges.
                  </p>

                  {/* Proceed to Checkout Button */}
                  <button
                    onClick={() => navigate("/checkout")}
                    className="w-full bg-[#d70f64] text-white py-4 rounded-lg hover:bg-[#b80d55] transition font-bold text-lg shadow-md hover:shadow-lg"
                  >
                    Proceed to Checkout
                  </button>

                  {/* Additional Info */}
                  <div className="mt-6 space-y-2 text-sm text-gray-500">
                    <p className="flex items-center">
                      <span className="mr-2">✓</span>
                      Free delivery on orders above Rs. 500
                    </p>
                    <p className="flex items-center">
                      <span className="mr-2">✓</span>
                      Easy returns & refunds
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Clear Cart Button */}
            <button
              onClick={clearCart}
              className="w-full mt-4 px-4 py-3 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition font-medium"
            >
              Clear All Items
            </button>
          </div>
        </div>
      </div>

      {/* Edit Item Modal */}
      {modalItem && (
        <MenuModal
          item={modalItem}
          onClose={() => {
            setModalItem(null);
            setModalItemIndex(null);
          }}
          onAddToCart={handleModalAddToCart}
          isEditing={true}
          editIndex={modalItemIndex}
        />
      )}
    </div>
  );
}