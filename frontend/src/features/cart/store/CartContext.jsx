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

  // Normalize an item (regular or deal) into a consistent cart item format
  const normalizeItem = (item) => {
    // Regular menu item
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
        cartId: item.cartId || `${Date.now()}-${Math.random()}`,
      };
    }

    // Deal item
    const customizedData = item.customizedData || {};
    const hasCustomization = item.hasCustomization || false;
    const quantity = Number(item.quantity || customizedData?.quantity || 1);

    let finalPrice = 0;
    if (hasCustomization && customizedData.finalTotal) {
      finalPrice = Number(customizedData.finalTotal) * quantity;
    } else if (item.discount_price) {
      finalPrice = Number(item.discount_price) * quantity;
    } else if (item.price) {
      finalPrice = Number(item.price) * quantity;
    } else {
      finalPrice = Number(item.base_price || item.original_price || 0) * quantity;
    }

    return {
      ...item,
      id: item.id || Date.now(),
      name: item.name || "Unknown Deal",
      image: item.image || "/images/placeholder.jpg",
      restaurantId: item.restaurantId ?? item.restaurant_id ?? item.restaurant?.id ?? null,
      base_price: Number(item.base_price || item.original_price || 0),
      price: finalPrice,
      quantity: quantity,
      isDeal: true,
      hasCustomization,
      customizedData: {
        ...customizedData,
        finalTotal: finalPrice / quantity,
        quantity: quantity,
      },
      cartId: item.cartId || `${Date.now()}-${Math.random()}`,
      dealItems: customizedData?.items || [],
    };
  };

  // Load cart from localStorage
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

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
    if (restaurantId) localStorage.setItem("cartRestaurant", restaurantId.toString());
    else localStorage.removeItem("cartRestaurant");
  }, [cartItems, restaurantId]);

  useEffect(() => {
    if (lastOrder) localStorage.setItem("lastOrder", JSON.stringify(lastOrder));
  }, [lastOrder]);

  // Helper: get price by size
  const getPriceBySize = (obj, size) => {
    if (!obj) return 0;
    const price = size === "small" ? Number(obj.price_small || obj.price || 0)
      : size === "medium" ? Number(obj.price_medium || obj.price || 0)
      : size === "large" ? Number(obj.price_large || obj.price || 0)
      : Number(obj.price || 0);
    return price;
  };

  const getToppingPriceForSize = (topping, size) => {
    if (!topping) return 0;
    return getPriceBySize(topping, size);
  };

  const getMenuItemPrice = (item) => {
    if (item.isDeal) return Number(item.price || 0) / (item.quantity || 1);
    const size = item.selectedSize || "medium";
    if (item.price_small || item.price_medium || item.price_large) return getPriceBySize(item, size);
    if (item.base_price) return Number(item.base_price);
    if (item.price) return Number(item.price);
    const variationPrice = Object.values(item.selectedVariations || {}).reduce(
      (sum, v) => sum + Number(v?.price || 0), 0
    );
    return variationPrice > 0 ? variationPrice : 0;
  };

  const getItemTotalPrice = (item) => {
    if (item.isDeal) return Number(item.price || 0);
    const size = item.selectedSize || "medium";
    const menuItemPrice = getMenuItemPrice(item);
    const variationPrice = Object.values(item.selectedVariations || {}).reduce(
      (sum, v) => sum + Number(v?.price || 0), 0
    );
    const crustPrice = getPriceBySize(item.selectedCrust, size);
    const addOnsPrice = (item.selectedAddOns || []).reduce((sum, a) => sum + Number(a.price || 0), 0);
    const toppingsPrice = (item.selectedToppings || []).reduce(
      (sum, t) => sum + getToppingPriceForSize(t, size), 0
    );
    const singleItemPrice = menuItemPrice + variationPrice + crustPrice + addOnsPrice + toppingsPrice;
    return singleItemPrice * (item.quantity || 1);
  };

  const getItemBasePrice = (item) => {
    if (item.isDeal) return Number(item.base_price || item.original_price || 0) * (item.quantity || 1);
    return getMenuItemPrice(item) * (item.quantity || 1);
  };

  const getItemExtrasPrice = (item) => {
    if (item.isDeal && item.hasCustomization && item.customizedData) {
      const extrasPerUnit = Number(item.customizedData.extrasTotal || 0);
      return extrasPerUnit * (item.quantity || 1);
    }
    if (item.isDeal) return 0;
    return getItemTotalPrice(item) - getItemBasePrice(item);
  };

  const getDealPriceBreakdown = (item) => {
    if (!item.isDeal || !item.customizedData) {
      return {
        basePrice: getItemBasePrice(item),
        extras: 0,
        discount: 0,
        finalPrice: getItemTotalPrice(item),
      };
    }
    const qty = item.quantity || 1;
    const pricePerUnit = Number(item.price || 0) / qty;
    const basePerUnit = Number(item.base_price || item.original_price || 0);
    return {
      basePrice: basePerUnit * qty,
      extras: (pricePerUnit - basePerUnit) * qty,
      discount: item.customizedData.discountAmount || 0,
      finalPrice: getItemTotalPrice(item),
      pricePerUnit,
      items: item.customizedData.items || [],
    };
  };

  const getToppingsDisplayInfo = (item) => {
    if (item.isDeal) return { names: "", price: 0 };
    const size = item.selectedSize || "medium";
    const names = (item.selectedToppings || []).map(t => t.name).join(", ");
    const price = (item.selectedToppings || []).reduce(
      (sum, t) => sum + getToppingPriceForSize(t, size), 0
    ) * (item.quantity || 1);
    return { names, price };
  };

  const getDealCustomizationDisplayInfo = (item) => {
    if (!item.isDeal || !item.hasCustomization || !item.customizedData) return null;
    const items = item.customizedData.items || [];
    if (!items.length) return null;
    return items.map(customItem => {
      const cust = customItem.customization || {};
      const customizations = [];
      if (cust.selectedSize && cust.selectedSize !== 'medium') customizations.push(`Size: ${cust.selectedSize}`);
      if (cust.selectedCrust && cust.selectedCrust !== 'regular') customizations.push(`Crust: ${cust.selectedCrust}`);
      if (cust.selectedToppings?.length) customizations.push(`${cust.selectedToppings.length} topping(s)`);
      if (cust.selectedAddons?.length) customizations.push(`${cust.selectedAddons.length} addon(s)`);
      return {
        name: customItem.name,
        customizations: customizations.length ? customizations.join(', ') : 'Standard',
      };
    });
  };

  const getItemBreakdown = (item) => ({
    basePrice: getItemBasePrice(item),
    totalPrice: getItemTotalPrice(item),
    extrasPrice: getItemExtrasPrice(item),
    quantity: item.quantity || 1,
    pricePerItem: getItemTotalPrice(item) / (item.quantity || 1),
  });

  // Add to cart
  const addToCart = (item) => {
    const normalized = normalizeItem(item);
    if (!normalized.restaurantId) {
      console.error("❌ Cart item missing restaurantId", normalized);
      return;
    }
    if (restaurantId && restaurantId !== normalized.restaurantId) {
      const confirmSwitch = window.confirm(
        "Your cart has items from another restaurant. Clear cart and add this item?"
      );
      if (!confirmSwitch) return;
      clearCart();
    }
    setRestaurantId(normalized.restaurantId);

    const existingIndex = cartItems.findIndex(cartItem => {
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
        return JSON.stringify(cartItem.customizedData) === JSON.stringify(normalized.customizedData);
      }
      return false;
    });

    if (existingIndex !== -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += normalized.quantity;
      updated[existingIndex].price = getItemTotalPrice(updated[existingIndex]);
      setCartItems(updated);
    } else {
      setCartItems([...cartItems, normalized]);
    }
  };

  // Update cart item (used by edit modal)
  const updateCartItem = (index, updatedItem) => {
    if (index === undefined || index === null || index < 0 || index >= cartItems.length) {
      console.error("updateCartItem called with invalid index", index);
      return;
    }
    const normalized = normalizeItem(updatedItem);
    // Preserve the original cartId to avoid duplicate keys
    normalized.cartId = cartItems[index].cartId;
    const updated = [...cartItems];
    updated[index] = normalized;
    setCartItems(updated);
  };

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

  // Totals
  const getSubtotal = () => cartItems.reduce((sum, item) => sum + getItemTotalPrice(item), 0);
  const getTotal = () => {
    const subtotal = getSubtotal();
    return subtotal + subtotal * 0.05;
  };
  const getOrderBreakdown = () => {
    const subtotal = getSubtotal();
    const tax = subtotal * 0.05;
    const total = subtotal + tax;
    const deliveryFee = 50;
    const grandTotal = total + deliveryFee;
    return { subtotal, tax, total, taxRate: 0.05, deliveryFee, grandTotal };
  };
  const getTotalItemCount = () => cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const getUniqueItemCount = () => cartItems.length;

  const setLastOrderData = (orderData) => setLastOrder(orderData);
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
      paymentMethod,
      deliveryAddress: address || "456 Customer Lane, New Delhi, India",
      estimatedDeliveryTime: "30-40 minutes",
      itemsCount: getTotalItemCount(),
      items: cartItems.map((item, idx) => ({
        id: item.id || idx + 1000,
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
          crust: item.selectedCrust,
        },
      })),
      restaurant: {
        name: "Foodie Heaven",
        address: "123 Pizza Street, Flavor Town",
        image: "/uploads/restaurant.jpg",
        deliveryTime: "30-45 min",
      },
      orderBreakdown: { subtotal, tax, total, deliveryFee, grandTotal },
    };
  };

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