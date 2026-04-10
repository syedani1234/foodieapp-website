// src/context/CartContext.jsx - FIXED DEAL PRICE CALCULATIONS
import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext(null);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [restaurantId, setRestaurantId] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [lastOrder, setLastOrder] = useState(null);

  /* ------------------ NORMALIZER ------------------ */
  const normalizeItem = (item) => {
    // Handle regular menu items
    if (!item.isDeal) {
      const normalizedToppings = Array.isArray(item.selectedToppings) 
        ? item.selectedToppings.map(topping => ({
            ...topping,
            price: Number(topping.price || topping.price_medium || topping.price_small || topping.price_large || 0),
            price_small: Number(topping.price_small || topping.price || 0),
            price_medium: Number(topping.price_medium || topping.price || 0),
            price_large: Number(topping.price_large || topping.price || 0),
          }))
        : [];

      const normalizedAddOns = Array.isArray(item.selectedAddOns)
        ? item.selectedAddOns.map(addOn => ({
            ...addOn,
            price: Number(addOn.price || 0),
          }))
        : [];

      return {
        ...item,
        id: item.id || Date.now(),
        name: item.name || "Unknown Item",
        image: item.image || "/images/placeholder.jpg",
        restaurantId: item.restaurantId ?? item.restaurant_id ?? item.restaurant?.id ?? null,
        base_price: Number(item.base_price || item.price || 0),
        price: Number(item.price || item.base_price || 0),
        quantity: Number(item.quantity || 1),
        selectedSize: item.selectedSize || "medium",
        selectedCrust: item.selectedCrust || null,
        selectedAddOns: normalizedAddOns,
        selectedToppings: normalizedToppings,
        selectedVariations: item.selectedVariations || {},
        isDeal: false,
        hasCustomization: false,
        cartId: item.cartId || Date.now() + Math.random(),
      };
    } 
    // Handle deal items - FIXED PRICE CALCULATION
    else {
      const customizedData = item.customizedData || {};
      const hasCustomization = item.hasCustomization || false;
      const quantity = Number(item.quantity || customizedData?.quantity || 1);
      
      // Calculate the correct price for the deal
      let finalPrice = 0;
      
      if (hasCustomization && customizedData.finalTotal) {
        // Use the final total from customization multiplied by quantity
        finalPrice = Number(customizedData.finalTotal) * quantity;
      } else if (item.discount_price) {
        // Use discount price if no customization
        finalPrice = Number(item.discount_price) * quantity;
      } else if (item.price) {
        // Use regular price
        finalPrice = Number(item.price) * quantity;
      } else {
        // Fallback to base price
        finalPrice = Number(item.base_price || item.original_price || 0) * quantity;
      }
      
      return {
        ...item,
        id: item.id || Date.now(),
        name: item.name || "Unknown Deal",
        image: item.image || "/images/placeholder.jpg",
        restaurantId: item.restaurantId ?? item.restaurant_id ?? item.restaurant?.id ?? null,
        base_price: Number(item.base_price || item.original_price || 0),
        price: finalPrice, // CORRECT PRICE INCLUDING QUANTITY
        quantity: quantity,
        isDeal: true,
        hasCustomization,
        customizedData: {
          ...customizedData,
          finalTotal: finalPrice / quantity, // Store price per unit
          quantity: quantity
        },
        cartId: item.cartId || Date.now() + Math.random(),
        dealItems: customizedData?.items || [],
      };
    }
  };

  /* ------------------ STORAGE ------------------ */
  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    const storedRestaurant = localStorage.getItem("cartRestaurant");
    const storedLastOrder = localStorage.getItem("lastOrder");

    if (storedCart) {
      try {
        const parsedCart = JSON.parse(storedCart);
        setCartItems(parsedCart.map(normalizeItem));
      } catch (e) {
        console.error("Error parsing cart from localStorage:", e);
        setCartItems([]);
      }
    }
    if (storedRestaurant) setRestaurantId(Number(storedRestaurant));
    if (storedLastOrder) {
      try {
        setLastOrder(JSON.parse(storedLastOrder));
      } catch (e) {
        console.error("Error parsing last order:", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
    if (restaurantId) localStorage.setItem("cartRestaurant", restaurantId.toString());
    else localStorage.removeItem("cartRestaurant");
  }, [cartItems, restaurantId]);

  useEffect(() => {
    if (lastOrder) {
      localStorage.setItem("lastOrder", JSON.stringify(lastOrder));
    }
  }, [lastOrder]);

  /* ------------------ PRICE CALCULATIONS ------------------ */
  const getPriceBySize = (obj, size) => {
    if (!obj) return 0;
    
    const price = size === "small" 
      ? Number(obj.price_small || obj.price || 0)
      : size === "medium" 
      ? Number(obj.price_medium || obj.price || 0)
      : size === "large" 
      ? Number(obj.price_large || obj.price || 0)
      : Number(obj.price || 0);
    
    return price;
  };

  const getToppingPriceForSize = (topping, size) => {
    if (!topping) return 0;
    
    const price = size === "small" 
      ? Number(topping.price_small || topping.price || 0)
      : size === "medium" 
      ? Number(topping.price_medium || topping.price || 0)
      : size === "large" 
      ? Number(topping.price_large || topping.price || 0)
      : Number(topping.price || 0);
    
    return price;
  };

  const getMenuItemPrice = (item) => {
    // For deal items, use the price that's already calculated per unit
    if (item.isDeal) {
      return Number(item.price || 0) / (item.quantity || 1);
    }
    
    const size = item.selectedSize || "medium";
    
    if (item.price_small || item.price_medium || item.price_large) {
      return getPriceBySize(item, size);
    }
    
    if (item.base_price) {
      return Number(item.base_price);
    }
    
    if (item.price) {
      return Number(item.price);
    }
    
    const variationPrice = Object.values(item.selectedVariations || {}).reduce(
      (sum, variation) => sum + Number(variation?.price || 0),
      0
    );
    
    return variationPrice > 0 ? variationPrice : 0;
  };

  /* ------------------ ITEM PRICE CALCULATION ------------------ */
  const getItemTotalPrice = (item) => {
    // For deal items, price already includes everything including quantity
    if (item.isDeal) {
      return Number(item.price || 0);
    }
    
    const size = item.selectedSize || "medium";
    
    const menuItemPrice = getMenuItemPrice(item);
    
    const variationPrice = Object.values(item.selectedVariations || {}).reduce(
      (sum, variation) => sum + Number(variation?.price || 0),
      0
    );

    const crustPrice = getPriceBySize(item.selectedCrust, size);

    const addOnsPrice = (item.selectedAddOns || []).reduce(
      (sum, addOn) => {
        const addOnPrice = Number(addOn.price || 0);
        return sum + addOnPrice;
      },
      0
    );

    const toppingsPrice = (item.selectedToppings || []).reduce(
      (sum, topping) => {
        const toppingPrice = getToppingPriceForSize(topping, size);
        return sum + toppingPrice;
      },
      0
    );

    const singleItemPrice = menuItemPrice + variationPrice + crustPrice + addOnsPrice + toppingsPrice;
    
    return singleItemPrice * (item.quantity || 1);
  };

  const getItemBasePrice = (item) => {
    if (item.isDeal) {
      // For deals, return the original/base price without customizations
      return Number(item.base_price || item.original_price || 0) * (item.quantity || 1);
    }
    return getMenuItemPrice(item) * (item.quantity || 1);
  };

  // Get extras price for deals
  const getItemExtrasPrice = (item) => {
    if (item.isDeal) {
      if (item.hasCustomization && item.customizedData) {
        // Return extras from customization data
        const extrasPerUnit = Number(item.customizedData.extrasTotal || 0);
        return extrasPerUnit * (item.quantity || 1);
      }
      return 0;
    }
    
    const itemTotalPrice = getItemTotalPrice(item);
    const itemBasePrice = getItemBasePrice(item);
    return itemTotalPrice - itemBasePrice;
  };

  // Get deal price breakdown for display
  const getDealPriceBreakdown = (item) => {
    if (!item.isDeal || !item.customizedData) {
      return {
        basePrice: getItemBasePrice(item),
        extras: 0,
        discount: 0,
        finalPrice: getItemTotalPrice(item)
      };
    }
    
    const customizedData = item.customizedData;
    const quantity = item.quantity || 1;
    const pricePerUnit = Number(item.price || 0) / quantity;
    const basePricePerUnit = Number(item.base_price || item.original_price || 0);
    
    return {
      basePrice: basePricePerUnit * quantity,
      extras: (pricePerUnit - basePricePerUnit) * quantity,
      discount: customizedData.discountAmount || 0,
      finalPrice: getItemTotalPrice(item),
      pricePerUnit: pricePerUnit,
      items: customizedData.items || []
    };
  };

  // Get toppings display info
  const getToppingsDisplayInfo = (item) => {
    if (item.isDeal) return { names: "", price: 0 };
    
    const size = item.selectedSize || "medium";
    if (!item.selectedToppings || item.selectedToppings.length === 0) {
      return { names: "", price: 0 };
    }
    
    const names = item.selectedToppings.map(t => t.name).join(", ");
    const price = (item.selectedToppings || []).reduce(
      (sum, topping) => {
        const toppingPrice = getToppingPriceForSize(topping, size);
        return sum + toppingPrice;
      },
      0
    ) * (item.quantity || 1);
    
    return { names, price };
  };

  // Get deal customization display info
  const getDealCustomizationDisplayInfo = (item) => {
    if (!item.isDeal || !item.hasCustomization || !item.customizedData) {
      return null;
    }
    
    const customizedData = item.customizedData;
    const items = customizedData.items || [];
    
    if (items.length === 0) {
      return null;
    }
    
    const customizations = items.map(customItem => {
      const customizations = [];
      const itemCustomization = customItem.customization || {};
      
      if (itemCustomization.selectedSize && itemCustomization.selectedSize !== 'medium') {
        customizations.push(`Size: ${itemCustomization.selectedSize}`);
      }
      
      if (itemCustomization.selectedCrust && itemCustomization.selectedCrust !== 'regular') {
        customizations.push(`Crust: ${itemCustomization.selectedCrust}`);
      }
      
      if (itemCustomization.selectedToppings && itemCustomization.selectedToppings.length > 0) {
        customizations.push(`${itemCustomization.selectedToppings.length} topping(s)`);
      }
      
      if (itemCustomization.selectedAddons && itemCustomization.selectedAddons.length > 0) {
        customizations.push(`${itemCustomization.selectedAddons.length} addon(s)`);
      }
      
      return {
        name: customItem.name,
        customizations: customizations.length > 0 ? customizations.join(', ') : 'Standard'
      };
    });
    
    return customizations;
  };

  // Get item breakdown for display
  const getItemBreakdown = (item) => {
    const basePrice = getItemBasePrice(item);
    const totalPrice = getItemTotalPrice(item);
    const extrasPrice = getItemExtrasPrice(item);
    const quantity = item.quantity || 1;
    
    return {
      basePrice,
      totalPrice,
      extrasPrice,
      quantity,
      pricePerItem: totalPrice / quantity
    };
  };

  /* ------------------ ADD TO CART ------------------ */
  const addToCart = (item) => {
    const normalized = normalizeItem(item);

    if (!normalized.restaurantId) {
      console.error("âŒ Cart item missing restaurantId", normalized);
      return;
    }

    // Check if we're switching restaurants
    if (restaurantId && restaurantId !== normalized.restaurantId) {
      const confirmSwitch = window.confirm(
        "Your cart has items from another restaurant. Clear cart and add this item?"
      );
      if (!confirmSwitch) return;
      clearCart();
    }

    setRestaurantId(normalized.restaurantId);

    // Check if the same item with the same customizations exists
    const index = cartItems.findIndex((cartItem) => {
      if (cartItem.id !== normalized.id) return false;
      if (cartItem.restaurantId !== normalized.restaurantId) return false;
      
      if (!cartItem.isDeal && !normalized.isDeal) {
        return (
          cartItem.selectedSize === normalized.selectedSize &&
          JSON.stringify(cartItem.selectedCrust) === JSON.stringify(normalized.selectedCrust) &&
          JSON.stringify(cartItem.selectedAddOns) === JSON.stringify(normalized.selectedAddOns) &&
          JSON.stringify(cartItem.selectedToppings) === JSON.stringify(normalized.selectedToppings) &&
          JSON.stringify(cartItem.selectedVariations) === JSON.stringify(normalized.selectedVariations)
        );
      }
      
      if (cartItem.isDeal && normalized.isDeal) {
        // For deals, compare customization data
        return JSON.stringify(cartItem.customizedData) === JSON.stringify(normalized.customizedData);
      }
      
      return false;
    });

    if (index !== -1) {
      const updated = [...cartItems];
      updated[index].quantity += normalized.quantity;
      updated[index].price = getItemTotalPrice(updated[index]); // Recalculate price
      setCartItems(updated);
    } else {
      setCartItems([...cartItems, normalized]);
    }
  };

  /* ------------------ UPDATE ITEM ------------------ */
  const updateCartItem = (index, updatedItem) => {
    const updated = [...cartItems];
    const normalizedItem = normalizeItem(updatedItem);
    updated[index] = normalizedItem;
    setCartItems(updated);
  };

  /* ------------------ REMOVE & CLEAR ------------------ */
  const removeFromCart = (index) => {
    const updated = [...cartItems];
    updated.splice(index, 1);
    setCartItems(updated);
    if (!updated.length) setRestaurantId(null);
  };

  const clearCart = () => {
    setCartItems([]);
    setRestaurantId(null);
    setEditingItem(null);
  };

  /* ------------------ TOTALS ------------------ */
  const getSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + getItemTotalPrice(item), 0);
  };

  const getTotal = () => {
    const subtotal = getSubtotal();
    const taxRate = 0.05; // 5% tax
    const tax = subtotal * taxRate;
    return subtotal + tax;
  };

  const getOrderBreakdown = () => {
    const subtotal = getSubtotal();
    const taxRate = 0.05; // 5% tax
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    
    return {
      subtotal,
      tax,
      total,
      taxRate,
      deliveryFee: 50, // Fixed delivery fee
      grandTotal: total + 50 // Including delivery
    };
  };

  const getTotalItemCount = () => {
    return cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  };

  const getUniqueItemCount = () => {
    return cartItems.length;
  };

  // Store last order for confirmation page
  const setLastOrderData = (orderData) => {
    setLastOrder(orderData);
  };

  // Create order data from cart for confirmation
  const createOrderData = (address = "", contactNumber = "", paymentMethod = "Credit Card") => {
    const subtotal = getSubtotal();
    const tax = subtotal * 0.05;
    const total = subtotal + tax;
    const deliveryFee = 50;
    const grandTotal = total + deliveryFee;
    
    return {
      id: Date.now().toString().slice(-6),
      orderNumber: `ORD${Date.now().toString().slice(-6)}`,
      totalAmount: grandTotal,
      status: "preparing",
      paymentMethod: paymentMethod,
      deliveryAddress: address || "456 Customer Lane, New Delhi, India",
      estimatedDeliveryTime: "30-40 minutes",
      itemsCount: getTotalItemCount(),
      items: cartItems.map((item, index) => ({
        id: item.id || index + 1000,
        name: item.name || "Menu Item",
        description: item.description || "",
        quantity: item.quantity || 1,
        price: getItemTotalPrice(item) / (item.quantity || 1),
        total: getItemTotalPrice(item),
        customization: {
          size: item.selectedSize,
          toppings: item.selectedToppings,
          addOns: item.selectedAddOns,
          variations: item.selectedVariations,
          crust: item.selectedCrust
        }
      })),
      restaurant: {
        name: "Foodie Heaven",
        address: "123 Pizza Street, Flavor Town",
        image: "/uploads/restaurant.jpg",
        deliveryTime: "30-45 min"
      },
      orderBreakdown: {
        subtotal,
        tax,
        total,
        deliveryFee,
        grandTotal
      }
    };
  };

  /* ------------------ PROVIDER ------------------ */
  return (
    <CartContext.Provider
      value={{
        cartItems,
        restaurantId,
        editingItem,
        setEditingItem,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        getItemTotalPrice,
        getItemBasePrice,
        getItemExtrasPrice,
        getDealPriceBreakdown,
        getItemBreakdown,
        getToppingsDisplayInfo,
        getDealCustomizationDisplayInfo,
        getSubtotal,
        getTotal,
        getOrderBreakdown,
        getTotalItemCount,
        getUniqueItemCount,
        lastOrder,
        setLastOrderData,
        createOrderData,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};


