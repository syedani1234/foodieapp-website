import React, { useState, useEffect } from "react";
import { useCart } from '../../cart/store/CartContext';
import { useFavorites } from '../../favorites/store/FavoritesContext';
import { formatImageUrl } from '../../shared/utils/formatImageUrl';

export default function MenuModal({
  item,
  onClose,
  onAddToCart,
  isEditing = false,
  editIndex = null,
}) {
  const { addToCart, updateCartItem } = useCart();
  const { isFavorite, addToFavorites, removeFromFavorites } = useFavorites();

  // Detect if this is a deal/combo item
  const isDealItem =
    item.isDeal ||
    item.isCombo ||
    item.dealOptions ||
    item.variationGroups?.some(
      (g) =>
        g.name.toLowerCase().includes("deal") ||
        g.name.toLowerCase().includes("combo"),
    );

  // State for regular items
  const [selectedSize, setSelectedSize] = useState("medium");
  const [selectedCrust, setSelectedCrust] = useState(null);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [selectedVariations, setSelectedVariations] = useState({});

  // State for deal items
  const [selectedDealOptions, setSelectedDealOptions] = useState({});
  const [selectedDealSize, setSelectedDealSize] = useState(null);

  const [quantity, setQuantity] = useState(1);
  const [isFav, setIsFav] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [pricePerUnit, setPricePerUnit] = useState(0);

  // Initialize state when item changes
  useEffect(() => {
    if (isEditing && item) {
      setQuantity(item.quantity || 1);
      if (isDealItem) {
        setSelectedDealOptions(item.selectedDealOptions || {});
        setSelectedDealSize(item.selectedSize || null);
        if (item.selectedVariations) setSelectedVariations(item.selectedVariations);
      } else {
        setSelectedSize(item.selectedSize || "medium");
        setSelectedCrust(item.selectedCrust || null);
        setSelectedToppings(item.selectedToppings || []);
        setSelectedAddOns(item.selectedAddOns || []);
        setSelectedVariations(item.selectedVariations || {});
      }
    } else {
      // New item – set defaults
      if (isDealItem) {
        const sizeGroup = item.variationGroups?.find(
          (g) =>
            g.name.toLowerCase().includes("size") ||
            g.name.toLowerCase().includes("deal"),
        );
        if (sizeGroup?.options?.[0]) {
          handleVariationChange(sizeGroup.id, sizeGroup.options[0]);
        }
      } else if (item.variationGroups?.length > 0) {
        item.variationGroups.forEach((group) => {
          if (group.options?.[0] && group.required) {
            handleVariationChange(group.id, group.options[0]);
          }
        });
      }
    }
    setIsFav(isFavorite(item.id));
    calculatePrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, isEditing, isDealItem]);

  // Recalculate prices whenever selections change
  useEffect(() => {
    calculatePrices();
  }, [
    selectedSize,
    selectedCrust,
    selectedToppings,
    selectedAddOns,
    selectedVariations,
    selectedDealOptions,
    selectedDealSize,
    quantity,
  ]);

  const getPriceBySize = (obj) => {
    if (!obj) return 0;
    if (selectedSize === "small" || selectedSize === "250ml" || selectedSize === "regular")
      return Number(obj.price_small ?? obj.price ?? 0);
    if (selectedSize === "medium" || selectedSize === "500ml" || selectedSize === "large")
      return Number(obj.price_medium ?? obj.price ?? 0);
    if (selectedSize === "large" || selectedSize === "1l" || selectedSize === "xl")
      return Number(obj.price_large ?? obj.price ?? 0);
    return Number(obj.price ?? 0);
  };

  const calculatePrices = () => {
    let basePrice = Number(item.base_price || item.price || 0);
    let extrasPrice = 0;

    if (isDealItem) {
      const dealVariations = Object.values(selectedVariations);
      dealVariations.forEach((variation) => {
        extrasPrice += Number(variation?.price || 0);
      });
      Object.values(selectedDealOptions).forEach((option) => {
        extrasPrice += Number(option?.price || 0);
      });
    } else {
      Object.values(selectedVariations).forEach((variation) => {
        extrasPrice += Number(variation?.price || 0);
      });
      extrasPrice += getPriceBySize(selectedCrust);
      selectedToppings.forEach((topping) => {
        extrasPrice += getPriceBySize(topping);
      });
      selectedAddOns.forEach((addOn) => {
        extrasPrice += Number(addOn.price || 0);
      });
    }

    const unitPrice = basePrice + extrasPrice;
    const total = unitPrice * quantity;
    setPricePerUnit(unitPrice);
    setTotalPrice(total);
  };

  const toggleTopping = (topping) => {
    const exists = selectedToppings.find((t) => t.id === topping.id);
    if (exists) {
      setSelectedToppings(selectedToppings.filter((t) => t.id !== topping.id));
    } else {
      setSelectedToppings([...selectedToppings, topping]);
    }
  };

  const toggleAddOn = (addOn) => {
    const exists = selectedAddOns.find((a) => a.id === addOn.id);
    if (exists) {
      setSelectedAddOns(selectedAddOns.filter((a) => a.id !== addOn.id));
    } else {
      setSelectedAddOns([...selectedAddOns, addOn]);
    }
  };

  const handleVariationChange = (groupId, option) => {
    const newVariations = { ...selectedVariations, [groupId]: option };
    setSelectedVariations(newVariations);

    const label = option.label?.toLowerCase() || "";
    if (isDealItem) {
      if (label.includes("small") || label.includes("250ml") || label.includes("regular")) {
        setSelectedSize("small");
        setSelectedDealSize("small");
      } else if (label.includes("medium") || label.includes("500ml") || label.includes("large")) {
        setSelectedSize("medium");
        setSelectedDealSize("medium");
      } else if (label.includes("large") || label.includes("1l") || label.includes("xl") || label.includes("family")) {
        setSelectedSize("large");
        setSelectedDealSize("large");
      }
    } else {
      if (label.includes("small") || label.includes("250ml") || label.includes("regular")) {
        setSelectedSize("small");
      } else if (label.includes("medium") || label.includes("500ml") || label.includes("large")) {
        setSelectedSize("medium");
      } else if (label.includes("large") || label.includes("1l") || label.includes("xl")) {
        setSelectedSize("large");
      }
    }
  };

  const handleDealOptionChange = (optionId, option) => {
    setSelectedDealOptions((prev) => ({ ...prev, [optionId]: option }));
  };

  const handleFavoriteToggle = () => {
    if (isFav) {
      removeFromFavorites(item.id);
    } else {
      addToFavorites({
        ...item,
        type: "dish",
        restaurantId: item.restaurant_id || item.restaurantId,
      });
    }
    setIsFav(!isFav);
  };

  const handleAddToCart = () => {
    const cartData = {
      ...item,
      quantity,
      selectedSize: isDealItem ? selectedDealSize : selectedSize,
      selectedCrust: isDealItem ? null : selectedCrust,
      selectedToppings: isDealItem ? [] : selectedToppings,
      selectedAddOns: isDealItem ? [] : selectedAddOns,
      selectedVariations,
      selectedDealOptions: isDealItem ? selectedDealOptions : {},
      itemTotal: totalPrice,
      pricePerUnit,
      updatedAt: Date.now(),
      restaurantId: item.restaurantId || item.restaurant_id,
      restaurantName: item.restaurantName || item.restaurant_name,
      isDeal: isDealItem,
    };

    if (onAddToCart) {
      onAddToCart(cartData);
    } else if (editIndex !== null && editIndex !== undefined) {
      updateCartItem(editIndex, cartData);
    } else {
      addToCart(cartData);
    }
    onClose();
  };

  const handleIncrementQuantity = () => setQuantity((prev) => prev + 1);
  const handleDecrementQuantity = () => setQuantity((prev) => Math.max(1, prev - 1));

  const checkRequiredSelections = () => {
    if (!item.variationGroups) return true;
    const requiredGroups = item.variationGroups.filter((g) => g.required);
    return requiredGroups.every((group) => selectedVariations[group.id]);
  };
  const canAddToCart = checkRequiredSelections();

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative">
          {item.image && (
            <img
              src={formatImageUrl(item.image)}
              alt={item.name}
              className="w-full h-64 object-cover"
              onError={(e) => (e.target.src = "/images/placeholder.jpg")}
            />
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center text-gray-700 hover:bg-white hover:text-red-500 transition-all shadow-lg"
          >
            <span className="text-xl font-bold">×</span>
          </button>
          <button
            onClick={handleFavoriteToggle}
            className="absolute top-4 left-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all"
          >
            <span className="text-xl">{isFav ? "❤️" : "🤍"}</span>
          </button>
        </div>

        <div className="p-6">
          {/* Info */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{item.name}</h2>
            <div className="flex items-center justify-between">
              <p className="text-gray-600 text-sm">{isDealItem ? "Combo Deal" : item.category_name}</p>
              <span className="text-lg font-bold text-green-600">
                {isDealItem ? "Deal" : "Base"}: Rs. {Number(item.base_price || item.price || 0).toFixed(0)}
              </span>
            </div>
          </div>

          {item.description && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <p className="text-gray-700">{item.description}</p>
            </div>
          )}

          {/* Deal Variations */}
          {isDealItem &&
            item.variationGroups?.map((g) => (
              <div key={g.id} className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  {g.name}
                  {g.required && <span className="text-red-500 ml-1">*</span>}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {g.options.map((o) => {
                    const isSelected = selectedVariations[g.id]?.id === o.id;
                    return (
                      <button
                        key={o.id}
                        className={`px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                          isSelected
                            ? "bg-pink-50 border-pink-500 text-pink-700"
                            : "bg-white border-gray-200 text-gray-700 hover:border-pink-300"
                        }`}
                        onClick={() => handleVariationChange(g.id, o)}
                      >
                        <div className="font-medium text-left">{o.label}</div>
                        {o.price > 0 && (
                          <div className="text-sm font-semibold text-pink-600 mt-1">
                            +Rs. {Number(o.price).toFixed(0)}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

          {/* Regular Item Variations */}
          {!isDealItem &&
            item.variationGroups?.map((g) => (
              <div key={g.id} className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  {g.name}
                  {g.required && <span className="text-red-500 ml-1">*</span>}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {g.options.map((o) => {
                    const isSelected = selectedVariations[g.id]?.id === o.id;
                    return (
                      <button
                        key={o.id}
                        className={`px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                          isSelected
                            ? "bg-green-50 border-green-500 text-green-700"
                            : "bg-white border-gray-200 text-gray-700 hover:border-green-300"
                        }`}
                        onClick={() => handleVariationChange(g.id, o)}
                      >
                        <div className="font-medium text-left">{o.label}</div>
                        {o.price > 0 && (
                          <div className="text-sm font-semibold text-green-600 mt-1">
                            +Rs. {Number(o.price).toFixed(0)}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

          {/* Deal Options */}
          {isDealItem &&
            item.dealOptions?.map((optionGroup) => (
              <div key={optionGroup.id} className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">
                  {optionGroup.name}
                  {optionGroup.required && <span className="text-red-500">*</span>}
                </h3>
                <div className="space-y-2">
                  {optionGroup.options.map((option) => {
                    const isSelected = selectedDealOptions[optionGroup.id]?.id === option.id;
                    return (
                      <label
                        key={option.id}
                        className="flex items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition"
                      >
                        <input
                          type="radio"
                          name={optionGroup.id}
                          checked={isSelected}
                          onChange={() => handleDealOptionChange(optionGroup.id, option)}
                          className="mr-3 h-5 w-5 text-pink-600 focus:ring-pink-500"
                        />
                        <div className="flex-1 flex justify-between items-center">
                          <span className="font-medium text-gray-800">{option.name}</span>
                          {option.price > 0 && (
                            <span className="font-semibold text-pink-600">
                              + Rs. {Number(option.price).toFixed(0)}
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

          {/* Crusts */}
          {!isDealItem && item.crusts?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Crust</h3>
              <div className="space-y-2">
                {item.crusts.map((c) => (
                  <label key={c.id} className="flex items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition">
                    <input
                      type="radio"
                      name="crust"
                      checked={selectedCrust?.id === c.id}
                      onChange={() => setSelectedCrust(c)}
                      className="mr-3 h-5 w-5 text-green-600 focus:ring-green-500"
                    />
                    <div className="flex-1 flex justify-between items-center">
                      <span className="font-medium text-gray-800">{c.name}</span>
                      <span className="font-semibold text-green-600">
                        + Rs. {getPriceBySize(c).toFixed(0)}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Toppings */}
          {!isDealItem && item.toppings?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Toppings</h3>
              <div className="space-y-2">
                {item.toppings.map((t) => {
                  const isSelected = selectedToppings.find((x) => x.id === t.id);
                  return (
                    <label key={t.id} className="flex items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={!!isSelected}
                        onChange={() => toggleTopping(t)}
                        className="mr-3 h-5 w-5 text-green-600 rounded focus:ring-green-500"
                      />
                      <div className="flex-1 flex justify-between items-center">
                        <span className="font-medium text-gray-800">{t.name}</span>
                        <span className="font-semibold text-green-600">
                          + Rs. {getPriceBySize(t).toFixed(0)}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add-Ons */}
          {!isDealItem && item.addOns?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Add-Ons</h3>
              <div className="space-y-2">
                {item.addOns.map((a) => {
                  const isSelected = selectedAddOns.find((x) => x.id === a.id);
                  return (
                    <label key={a.id} className="flex items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={!!isSelected}
                        onChange={() => toggleAddOn(a)}
                        className="mr-3 h-5 w-5 text-green-600 rounded focus:ring-green-500"
                      />
                      <div className="flex-1 flex justify-between items-center">
                        <span className="font-medium text-gray-800">{a.name}</span>
                        <span className="font-semibold text-green-600">
                          + Rs. {Number(a.price || 0).toFixed(0)}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price Summary */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-gray-700">Quantity:</span>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleDecrementQuantity}
                  disabled={quantity <= 1}
                  className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <span className="text-xl">−</span>
                </button>
                <span className="text-2xl font-bold text-gray-800 min-w-[2rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={handleIncrementQuantity}
                  className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition"
                >
                  <span className="text-xl">+</span>
                </button>
              </div>
            </div>

            <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Base Price:</span>
                <span className="font-medium">
                  Rs. {Number(item.base_price || item.price || 0).toFixed(0)}
                </span>
              </div>
              {pricePerUnit > Number(item.base_price || item.price || 0) && (
                <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                  <span>Extras & Modifications:</span>
                  <span className="text-green-600 font-medium">
                    +Rs. {(pricePerUnit - Number(item.base_price || item.price || 0)).toFixed(0)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center text-lg font-bold text-gray-800">
                <span>Price per item:</span>
                <span>Rs. {pricePerUnit.toFixed(0)}</span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xl font-bold text-gray-800">Total: Rs. {totalPrice.toFixed(0)}</div>
                  {quantity > 1 && (
                    <div className="text-sm text-gray-500">(Rs. {pricePerUnit.toFixed(0)} per item)</div>
                  )}
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={!canAddToCart}
                  className={`px-8 py-3 rounded-lg font-bold transition-all duration-200 hover:scale-105 shadow-lg ${
                    canAddToCart
                      ? isDealItem
                        ? "bg-pink-600 hover:bg-pink-700 text-white"
                        : "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {isEditing ? "🔄 Update Item" : "🛒 Add to Cart"}
                </button>
              </div>
            </div>
          </div>

          {/* Selection Summary */}
          {(selectedSize !== "medium" ||
            Object.keys(selectedVariations).length > 0 ||
            (isDealItem && Object.keys(selectedDealOptions).length > 0) ||
            selectedToppings.length > 0 ||
            selectedAddOns.length > 0 ||
            selectedCrust) && (
            <div className="text-sm text-gray-600 space-y-1 bg-gray-50 p-4 rounded-xl">
              <div className="font-medium mb-2">Your Selections:</div>
              {selectedSize && selectedSize !== "medium" && (
                <div>• Size: {selectedSize.charAt(0).toUpperCase() + selectedSize.slice(1)}</div>
              )}
              {Object.values(selectedVariations).map((v, idx) => (
                <div key={idx}>• {v.label}: {v.price > 0 ? `+Rs. ${v.price}` : "Included"}</div>
              ))}
              {isDealItem &&
                Object.values(selectedDealOptions).map((opt, idx) => (
                  <div key={idx}>• {opt.name}: {opt.price > 0 ? `+Rs. ${opt.price}` : "Included"}</div>
                ))}
              {selectedCrust && <div>• Crust: {selectedCrust.name}</div>}
              {selectedToppings.length > 0 && (
                <div>• Toppings: {selectedToppings.map((t) => t.name).join(", ")}</div>
              )}
              {selectedAddOns.length > 0 && (
                <div>• Add-ons: {selectedAddOns.map((a) => a.name).join(", ")}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}