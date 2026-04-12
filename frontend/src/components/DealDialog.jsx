import API_BASE_URL from "../config/api";

// src/components/DealDialog.jsx - COMPLETELY UPDATED AND FIXED
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Divider,
  Card,
  CardContent,
  Grid,
  Paper,
  Alert,
  Snackbar,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Close,
  Add,
  Remove,
  LocalPizza,
  Fastfood,
  RestaurantMenu,
  CheckCircle,
  Restaurant,
  ExpandMore,
  ArrowForward,
  ShoppingCart,
} from "@mui/icons-material";
import axios from "axios";

const DealDialog = ({
  open,
  onClose,
  deal,
  onCustomizationComplete,
  existingCustomization,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customization, setCustomization] = useState({});
  const [dealQuantity, setDealQuantity] = useState(1);
  const [successMessage, setSuccessMessage] = useState("");
  const [expandedItem, setExpandedItem] = useState(null);

  const steps = ["Select Quantity", "Customize Items", "Review & Confirm"];

  // Improved deal type detection
  const getDealType = () => {
    if (!deal) return null;

    const title = (deal.title || "").toLowerCase();
    const description = (deal.description || "").toLowerCase();
    const tags = (deal.tags || "").toLowerCase();

    // Check for pizza and burger mentions
    const hasPizza =
      title.includes("pizza") ||
      description.includes("pizza") ||
      tags.includes("pizza");
    const hasBurger =
      title.includes("burger") ||
      description.includes("burger") ||
      tags.includes("burger");
    const hasCombo =
      title.includes("combo") ||
      description.includes("combo") ||
      tags.includes("combo");

    // Determine deal type
    if (hasPizza && hasBurger) return "pizza-burger-combo";
    if (hasPizza && !hasBurger) return "pizza";
    if (hasBurger && !hasPizza) return "burger";
    if (hasCombo) return "combo";

    return "general";
  };

  const dealType = getDealType();

  // IMPROVED: Parse deal items correctly
  const generateDealItems = () => {
    if (!deal) return [];

    const title = (deal.title || "").toLowerCase();
    const description = (deal.description || "").toLowerCase();
    const items = [];

    // Get actual deal price and original price
    const dealPrice = deal.discount_price || deal.price || 0;
    const originalPrice =
      deal.original_price || deal.discount_price || deal.price || 0;

    switch (dealType) {
      case "pizza":
        // Single pizza deal
        items.push({
          id: "pizza-1",
          type: "pizza",
          name: "Medium Cheese Pizza",
          description: deal.description || "Delicious pizza",
          base_price: dealPrice,
          original_price: originalPrice,
          customizable: true,
          quantityInDeal: 1,
          options: {
            sizes: [
              { id: "small", name: "Small", price: -100 }, // Cheaper than medium
              { id: "medium", name: "Medium", price: 0 },
              { id: "large", name: "Large", price: 150 },
            ],
            crusts: [
              { id: "regular", name: "Regular", price: 0 },
              { id: "thin", name: "Thin Crust", price: 30 },
              { id: "cheesy", name: "Cheesy Crust", price: 50 },
            ],
            toppings: [
              { id: "extra-cheese", name: "Extra Cheese", price: 40 },
              { id: "mushrooms", name: "Mushrooms", price: 25 },
              { id: "olives", name: "Olives", price: 20 },
              { id: "pepperoni", name: "Pepperoni", price: 45 },
            ],
          },
        });
        break;

      case "burger":
        // Single burger deal - FIXED: Parse item count correctly
        const burgerCount = parseBurgerCount(title, description);

        for (let i = 1; i <= burgerCount; i++) {
          items.push({
            id: `burger-${i}`,
            type: "burger",
            name:
              burgerCount > 1
                ? `Classic Beef Burger (${i} of ${burgerCount})`
                : "Classic Beef Burger",
            description:
              burgerCount > 1
                ? `${burgerCount} Classic Beef Burgers`
                : "Juicy beef burger",
            base_price: Math.floor(dealPrice / burgerCount),
            original_price: Math.floor(originalPrice / burgerCount),
            customizable: true,
            quantityInDeal: 1,
            options: {
              sizes: [
                { id: "regular", name: "Regular", price: 0 },
                { id: "large", name: "Large", price: 50 },
                { id: "jumbo", name: "Jumbo", price: 80 },
              ],
              addons: [
                { id: "extra-patty", name: "Extra Patty", price: 50 },
                { id: "bacon", name: "Bacon", price: 30 },
                { id: "cheese", name: "Cheese Slice", price: 20 },
                { id: "avocado", name: "Avocado", price: 25 },
                { id: "fried-egg", name: "Fried Egg", price: 15 },
              ],
            },
          });
        }
        break;

      case "pizza-burger-combo":
        // Pizza + Burger combo - FIXED: Only 1 burger, not 2
        // Based on your example: Medium Pizza (350) + Burger (250) = 600, discount to 449
        const pizzaBasePrice = 350; // Original pizza price
        const burgerBasePrice = 250; // Original burger price
        const comboTotalOriginal = pizzaBasePrice + burgerBasePrice;

        // Add pizza item
        items.push({
          id: "pizza-1",
          type: "pizza",
          name: "Medium Cheese Pizza",
          description: "Delicious pizza included in combo",
          base_price: Math.floor(
            (pizzaBasePrice / comboTotalOriginal) * dealPrice,
          ),
          original_price: pizzaBasePrice,
          customizable: true,
          quantityInDeal: 1,
          options: {
            sizes: [
              { id: "small", name: "Small", price: -100 },
              { id: "medium", name: "Medium", price: 0 },
              { id: "large", name: "Large", price: 150 },
            ],
            crusts: [
              { id: "regular", name: "Regular", price: 0 },
              { id: "thin", name: "Thin Crust", price: 30 },
              { id: "cheesy", name: "Cheesy Crust", price: 50 },
            ],
            toppings: [
              { id: "extra-cheese", name: "Extra Cheese", price: 40 },
              { id: "mushrooms", name: "Mushrooms", price: 25 },
              { id: "olives", name: "Olives", price: 20 },
              { id: "pepperoni", name: "Pepperoni", price: 45 },
            ],
          },
        });

        // Add burger item - ONLY 1 BURGER
        items.push({
          id: "burger-1",
          type: "burger",
          name: "Classic Beef Burger",
          description: "Juicy burger included in combo",
          base_price: Math.floor(
            (burgerBasePrice / comboTotalOriginal) * dealPrice,
          ),
          original_price: burgerBasePrice,
          customizable: true,
          quantityInDeal: 1,
          options: {
            sizes: [
              { id: "regular", name: "Regular", price: 0 },
              { id: "large", name: "Large", price: 50 },
              { id: "jumbo", name: "Jumbo", price: 80 },
            ],
            addons: [
              { id: "extra-patty", name: "Extra Patty", price: 50 },
              { id: "bacon", name: "Bacon", price: 30 },
              { id: "cheese", name: "Cheese Slice", price: 20 },
              { id: "avocado", name: "Avocado", price: 25 },
              { id: "fried-egg", name: "Fried Egg", price: 15 },
            ],
          },
        });
        break;

      default:
        // General deal
        items.push({
          id: "item-1",
          type: "general",
          name: deal.title || "Deal",
          description: deal.description || "Special offer",
          base_price: dealPrice,
          original_price: originalPrice,
          customizable: false,
          quantityInDeal: 1,
        });
    }

    return items;
  };

  // Helper function to parse burger count from title/description
  const parseBurgerCount = (title, description) => {
    const text = `${title} ${description}`.toLowerCase();

    // Check for "2 burgers" or similar patterns
    if (
      text.includes("2 burgers") ||
      text.includes("2 burger") ||
      text.includes("two burgers") ||
      text.includes("two burger") ||
      (text.includes("2") && text.includes("burger"))
    ) {
      return 2;
    }

    // Check for "3 burgers" or similar patterns
    if (
      text.includes("3 burgers") ||
      text.includes("3 burger") ||
      text.includes("three burgers") ||
      text.includes("three burger")
    ) {
      return 3;
    }

    // Default to 1 burger
    return 1;
  };

  const dealItems = generateDealItems();

  // Count items by type
  const burgerCount = dealItems.filter((item) => item.type === "burger").length;
  const pizzaCount = dealItems.filter((item) => item.type === "pizza").length;

  useEffect(() => {
    if (open && deal) {
      // Initialize customization for each item
      const initialCustomization = {};
      dealItems.forEach((item) => {
        initialCustomization[item.id] = {
          selectedSize: item.type === "pizza" ? "medium" : "regular",
          selectedCrust: item.type === "pizza" ? "regular" : null,
          selectedToppings: [],
          selectedAddons: [],
          ...(existingCustomization?.items?.find((i) => i.itemId === item.id)
            ?.customization || {}),
        };
      });
      setCustomization(initialCustomization);

      // Expand first item by default
      if (dealItems.length > 0) {
        setExpandedItem(dealItems[0].id);
      }

      if (existingCustomization) {
        setDealQuantity(existingCustomization.quantity || 1);
      }
    }
  }, [open, deal]);

  // Handle step changes
  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleItemExpand = (itemId) => {
    setExpandedItem(expandedItem === itemId ? null : itemId);
  };

  // Customization handlers
  const handleSizeChange = (itemId, size) => {
    setCustomization((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        selectedSize: size,
      },
    }));
  };

  const handleCrustChange = (itemId, crust) => {
    setCustomization((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        selectedCrust: crust,
      },
    }));
  };

  const handleToppingToggle = (itemId, toppingId) => {
    setCustomization((prev) => {
      const currentToppings = prev[itemId]?.selectedToppings || [];
      const isSelected = currentToppings.includes(toppingId);

      return {
        ...prev,
        [itemId]: {
          ...prev[itemId],
          selectedToppings: isSelected
            ? currentToppings.filter((t) => t !== toppingId)
            : [...currentToppings, toppingId],
        },
      };
    });
  };

  const handleAddonToggle = (itemId, addonId) => {
    setCustomization((prev) => {
      const currentAddons = prev[itemId]?.selectedAddons || [];
      const isSelected = currentAddons.includes(addonId);

      return {
        ...prev,
        [itemId]: {
          ...prev[itemId],
          selectedAddons: isSelected
            ? currentAddons.filter((a) => a !== addonId)
            : [...currentAddons, addonId],
        },
      };
    });
  };

  const handleQuantityChange = (delta) => {
    const newQuantity = Math.max(1, dealQuantity + delta);
    setDealQuantity(newQuantity);
  };

  // Calculate item total
  const calculateItemTotal = (item) => {
    if (!item) return 0;

    const itemCustomization = customization[item.id] || {};
    let total = item.base_price;

    // Add size price
    const selectedSize = item.options?.sizes?.find(
      (s) => s.id === itemCustomization.selectedSize,
    );
    if (selectedSize) {
      total += selectedSize.price || 0;
    }

    // Add crust price for pizza
    if (item.type === "pizza") {
      const selectedCrust = item.options?.crusts?.find(
        (c) => c.id === itemCustomization.selectedCrust,
      );
      if (selectedCrust) {
        total += selectedCrust.price || 0;
      }

      // Add toppings price
      if (itemCustomization.selectedToppings && item.options?.toppings) {
        itemCustomization.selectedToppings.forEach((toppingId) => {
          const topping = item.options.toppings.find((t) => t.id === toppingId);
          if (topping) {
            total += topping.price || 0;
          }
        });
      }
    }

    // Add addons price for burger
    if (item.type === "burger") {
      if (itemCustomization.selectedAddons && item.options?.addons) {
        itemCustomization.selectedAddons.forEach((addonId) => {
          const addon = item.options.addons.find((a) => a.id === addonId);
          if (addon) {
            total += addon.price || 0;
          }
        });
      }
    }

    return Math.max(0, total); // Ensure non-negative
  };

  // Calculate totals
  const calculateItemsTotal = () => {
    return dealItems.reduce((total, item) => {
      return total + calculateItemTotal(item);
    }, 0);
  };

  const calculateExtrasTotal = () => {
    return dealItems.reduce((total, item) => {
      const itemCustomization = customization[item.id] || {};
      let extras = 0;

      // Size extras
      const selectedSize = item.options?.sizes?.find(
        (s) => s.id === itemCustomization.selectedSize,
      );
      if (selectedSize && selectedSize.price) {
        extras += selectedSize.price;
      }

      // Crust extras for pizza
      if (item.type === "pizza") {
        const selectedCrust = item.options?.crusts?.find(
          (c) => c.id === itemCustomization.selectedCrust,
        );
        if (selectedCrust && selectedCrust.price) {
          extras += selectedCrust.price;
        }

        // Toppings extras
        if (itemCustomization.selectedToppings && item.options?.toppings) {
          itemCustomization.selectedToppings.forEach((toppingId) => {
            const topping = item.options.toppings.find(
              (t) => t.id === toppingId,
            );
            if (topping && topping.price) {
              extras += topping.price;
            }
          });
        }
      }

      // Burger addons extras
      if (item.type === "burger") {
        if (itemCustomization.selectedAddons && item.options?.addons) {
          itemCustomization.selectedAddons.forEach((addonId) => {
            const addon = item.options.addons.find((a) => a.id === addonId);
            if (addon && addon.price) {
              extras += addon.price;
            }
          });
        }
      }

      return total + extras;
    }, 0);
  };

  const calculateDealTotal = () => {
    const itemsTotal = calculateItemsTotal();
    return itemsTotal * dealQuantity;
  };

  const calculateFinalTotal = () => {
    return calculateDealTotal();
  };

  const calculateOriginalTotal = () => {
    return (
      dealItems.reduce((total, item) => {
        return total + (item.original_price || item.base_price);
      }, 0) * dealQuantity
    );
  };

  const calculateDiscount = () => {
    const originalTotal = calculateOriginalTotal();
    const finalTotal = calculateFinalTotal();

    return Math.max(0, originalTotal - finalTotal);
  };

  const handleAddToCart = () => {
    if (!deal) return;

    const customizedItems = dealItems.map((item) => ({
      itemId: item.id,
      type: item.type,
      name: item.name,
      basePrice: item.base_price,
      extras: calculateItemTotal(item) - item.base_price,
      total: calculateItemTotal(item),
      customization: customization[item.id] || {},
    }));

    const customizedData = {
      dealId: deal.id,
      dealName: deal.title || deal.name,
      dealType: dealType,
      originalPrice: calculateOriginalTotal() / dealQuantity,
      discountPrice: deal.discount_price || deal.price || 0,
      items: customizedItems,
      quantity: dealQuantity,
      itemsTotal: calculateItemsTotal(),
      extrasTotal: calculateExtrasTotal(),
      dealTotal: calculateDealTotal(),
      finalTotal: calculateFinalTotal(),
      discountAmount: calculateDiscount(),
      timestamp: new Date().toISOString(),
      restaurant: deal.restaurant_name || deal.restaurant || "Restaurant",
      isEditing: !!existingCustomization,
    };

    if (onCustomizationComplete) {
      onCustomizationComplete(customizedData);
    }

    setSuccessMessage(
      existingCustomization ? "Deal updated!" : "Added to cart!",
    );

    setTimeout(() => {
      onClose();
      setSuccessMessage("");
    }, 1500);
  };

  // Render burger customization
  const renderBurgerCustomization = (item) => {
    const itemCustomization = customization[item.id] || {};

    return (
      <Box>
        {/* Header */}
        <Box mb={2}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            {item.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Base: Rs. {item.base_price} (per burger)
          </Typography>
          <Typography variant="subtitle1" fontWeight="bold" color="primary">
            Rs. {calculateItemTotal(item).toFixed(2)} each
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Size Selection */}
        {item.options?.sizes && (
          <Box mb={3}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Select Size
            </Typography>
            <RadioGroup
              value={itemCustomization.selectedSize || "regular"}
              onChange={(e) => handleSizeChange(item.id, e.target.value)}
            >
              <Grid container spacing={1}>
                {item.options.sizes.map((size) => (
                  <Grid item xs={12} sm={4} key={size.id}>
                    <Card
                      variant="outlined"
                      sx={{
                        cursor: "pointer",
                        border:
                          itemCustomization.selectedSize === size.id
                            ? "2px solid brown"
                            : "1px solid #ddd",
                        bgcolor:
                          itemCustomization.selectedSize === size.id
                            ? "#f5e6d3"
                            : "transparent",
                      }}
                      onClick={() => handleSizeChange(item.id, size.id)}
                    >
                      <CardContent sx={{ textAlign: "center", py: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {size.name}
                        </Typography>
                        {size.price > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            +Rs. {size.price}
                          </Typography>
                        )}
                        {size.price === 0 && (
                          <Typography variant="caption" color="success.main">
                            No extra charge
                          </Typography>
                        )}
                        {size.price < 0 && (
                          <Typography variant="caption" color="error.main">
                            -Rs. {Math.abs(size.price)}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </RadioGroup>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Addons */}
        {item.options?.addons && (
          <Box mb={3}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Add Extras (Optional)
            </Typography>
            <FormGroup>
              <Grid container spacing={2}>
                {item.options.addons.map((addon) => (
                  <Grid item xs={12} sm={6} key={addon.id}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={(
                            itemCustomization.selectedAddons || []
                          ).includes(addon.id)}
                          onChange={() => handleAddonToggle(item.id, addon.id)}
                          color="primary"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2">{addon.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            +Rs. {addon.price}
                            {burgerCount > 1 && " per burger"}
                          </Typography>
                        </Box>
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            </FormGroup>
          </Box>
        )}

        {/* Summary */}
        <Box mt={3} p={2} bgcolor="grey.50" borderRadius={1}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            {item.name} Summary
          </Typography>
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography variant="body2">Base Price:</Typography>
            <Typography variant="body2">Rs. {item.base_price}</Typography>
          </Box>
          {calculateItemTotal(item) !== item.base_price && (
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2">Customizations:</Typography>
              <Typography
                variant="body2"
                color={
                  calculateItemTotal(item) > item.base_price
                    ? "success.main"
                    : "error.main"
                }
              >
                {calculateItemTotal(item) > item.base_price ? "+" : ""}
                Rs. {(calculateItemTotal(item) - item.base_price).toFixed(2)}
              </Typography>
            </Box>
          )}
          <Divider sx={{ my: 1 }} />
          <Box display="flex" justifyContent="space-between">
            <Typography variant="subtitle2" fontWeight="bold">
              Total:
            </Typography>
            <Typography variant="subtitle2" fontWeight="bold" color="primary">
              Rs. {calculateItemTotal(item).toFixed(2)}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  // Render pizza customization
  const renderPizzaCustomization = (item) => {
    const itemCustomization = customization[item.id] || {};

    return (
      <Box>
        {/* Header */}
        <Box mb={2}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            {item.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Base: Rs. {item.base_price}
          </Typography>
          <Typography variant="subtitle1" fontWeight="bold" color="primary">
            Rs. {calculateItemTotal(item).toFixed(2)}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Size Selection */}
        {item.options?.sizes && (
          <Box mb={3}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Select Size
            </Typography>
            <RadioGroup
              value={itemCustomization.selectedSize || "medium"}
              onChange={(e) => handleSizeChange(item.id, e.target.value)}
            >
              <Grid container spacing={1}>
                {item.options.sizes.map((size) => (
                  <Grid item xs={12} sm={4} key={size.id}>
                    <Card
                      variant="outlined"
                      sx={{
                        cursor: "pointer",
                        border:
                          itemCustomization.selectedSize === size.id
                            ? "2px solid orange"
                            : "1px solid #ddd",
                        bgcolor:
                          itemCustomization.selectedSize === size.id
                            ? "#fff3e0"
                            : "transparent",
                      }}
                      onClick={() => handleSizeChange(item.id, size.id)}
                    >
                      <CardContent sx={{ textAlign: "center", py: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {size.name}
                        </Typography>
                        {size.price > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            +Rs. {size.price}
                          </Typography>
                        )}
                        {size.price === 0 && (
                          <Typography variant="caption" color="success.main">
                            No extra charge
                          </Typography>
                        )}
                        {size.price < 0 && (
                          <Typography variant="caption" color="error.main">
                            -Rs. {Math.abs(size.price)}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </RadioGroup>
          </Box>
        )}

        {/* Crust Selection */}
        {item.options?.crusts && (
          <Box mb={3}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Select Crust
            </Typography>
            <RadioGroup
              value={itemCustomization.selectedCrust || "regular"}
              onChange={(e) => handleCrustChange(item.id, e.target.value)}
            >
              <Grid container spacing={1}>
                {item.options.crusts.map((crust) => (
                  <Grid item xs={12} sm={4} key={crust.id}>
                    <Card
                      variant="outlined"
                      sx={{
                        cursor: "pointer",
                        border:
                          itemCustomization.selectedCrust === crust.id
                            ? "2px solid orange"
                            : "1px solid #ddd",
                        bgcolor:
                          itemCustomization.selectedCrust === crust.id
                            ? "#fff3e0"
                            : "transparent",
                      }}
                      onClick={() => handleCrustChange(item.id, crust.id)}
                    >
                      <CardContent sx={{ textAlign: "center", py: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {crust.name}
                        </Typography>
                        {crust.price > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            +Rs. {crust.price}
                          </Typography>
                        )}
                        {crust.price === 0 && (
                          <Typography variant="caption" color="success.main">
                            No extra charge
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </RadioGroup>
          </Box>
        )}

        {/* Toppings */}
        {item.options?.toppings && (
          <Box mb={3}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Add Toppings (Optional)
            </Typography>
            <FormGroup>
              <Grid container spacing={1}>
                {item.options.toppings.map((topping) => (
                  <Grid item xs={12} sm={6} md={4} key={topping.id}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={(
                            itemCustomization.selectedToppings || []
                          ).includes(topping.id)}
                          onChange={() =>
                            handleToppingToggle(item.id, topping.id)
                          }
                          color="primary"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2">
                            {topping.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            +Rs. {topping.price}
                          </Typography>
                        </Box>
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            </FormGroup>
          </Box>
        )}

        {/* Summary */}
        <Box mt={3} p={2} bgcolor="grey.50" borderRadius={1}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            {item.name} Summary
          </Typography>
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography variant="body2">Base Price:</Typography>
            <Typography variant="body2">Rs. {item.base_price}</Typography>
          </Box>
          {calculateItemTotal(item) !== item.base_price && (
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2">Customizations:</Typography>
              <Typography
                variant="body2"
                color={
                  calculateItemTotal(item) > item.base_price
                    ? "success.main"
                    : "error.main"
                }
              >
                {calculateItemTotal(item) > item.base_price ? "+" : ""}
                Rs. {(calculateItemTotal(item) - item.base_price).toFixed(2)}
              </Typography>
            </Box>
          )}
          <Divider sx={{ my: 1 }} />
          <Box display="flex" justifyContent="space-between">
            <Typography variant="subtitle2" fontWeight="bold">
              Total:
            </Typography>
            <Typography variant="subtitle2" fontWeight="bold" color="primary">
              Rs. {calculateItemTotal(item).toFixed(2)}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  const renderStepContent = () => {
    const dealPrice = deal.discount_price || deal.price || 0;
    const originalTotal = calculateOriginalTotal();
    const finalTotal = calculateFinalTotal();
    const discountAmount = calculateDiscount();
    const itemsTotal = calculateItemsTotal();
    const extrasTotal = calculateExtrasTotal();

    switch (activeStep) {
      case 0: // Select Quantity
        return (
          <Box>
            <Paper
              sx={{
                p: 3,
                mb: 3,
                bgcolor: "primary.50",
                border: "1px solid",
                borderColor: "primary.100",
              }}
            >
              <Typography
                variant="h5"
                fontWeight="bold"
                color="primary.main"
                gutterBottom
              >
                {deal.title || deal.name}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {deal.description || "Special offer"}
              </Typography>
              {burgerCount > 1 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    This deal contains <strong>{burgerCount} burgers</strong>.
                    Each burger can be customized separately.
                  </Typography>
                </Alert>
              )}
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Deal Items
              </Typography>
              <List>
                {dealItems.map((item, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      borderBottom:
                        index < dealItems.length - 1
                          ? "1px solid #eee"
                          : "none",
                      py: 2,
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center">
                          {item.type === "pizza" && (
                            <LocalPizza sx={{ mr: 2, color: "orange.main" }} />
                          )}
                          {item.type === "burger" && (
                            <Fastfood sx={{ mr: 2, color: "brown.main" }} />
                          )}
                          <Typography variant="subtitle1" fontWeight="medium">
                            {item.name}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {item.description}
                        </Typography>
                      }
                    />
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      color="primary"
                    >
                      Rs. {item.base_price}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Select Quantity
              </Typography>

              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                mb={3}
              >
                <IconButton
                  onClick={() => handleQuantityChange(-1)}
                  disabled={dealQuantity <= 1}
                  size="large"
                  sx={{
                    border: "1px solid",
                    borderColor: "primary.main",
                    mr: 2,
                  }}
                >
                  <Remove />
                </IconButton>

                <Typography
                  variant="h3"
                  sx={{ minWidth: "80px", textAlign: "center" }}
                >
                  {dealQuantity}
                </Typography>

                <IconButton
                  onClick={() => handleQuantityChange(1)}
                  size="large"
                  sx={{
                    border: "1px solid",
                    borderColor: "primary.main",
                    ml: 2,
                  }}
                >
                  <Add />
                </IconButton>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body1">Deal Price:</Typography>
                  <Typography variant="body1">
                    Rs. {dealPrice.toFixed(2)}
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body1">Quantity:</Typography>
                  <Typography variant="body1">× {dealQuantity}</Typography>
                </Box>

                <Divider sx={{ my: 1 }} />

                <Box display="flex" justifyContent="space-between">
                  <Typography variant="h6">Subtotal:</Typography>
                  <Typography
                    variant="h6"
                    color="primary.main"
                    fontWeight="bold"
                  >
                    Rs. {(dealPrice * dealQuantity).toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        );

      case 1: // Customize Items
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Customize each item below. Prices update in real-time.
                {burgerCount > 1 && (
                  <>
                    <br />
                    <strong>Note:</strong> This deal contains {burgerCount}{" "}
                    burgers. Customize each burger separately.
                  </>
                )}
              </Typography>
            </Alert>

            {dealItems.map((item, index) => (
              <Paper
                key={item.id}
                sx={{
                  p: 3,
                  mb: 3,
                  border: "2px solid",
                  borderColor:
                    item.type === "pizza"
                      ? "orange.main"
                      : item.type === "burger"
                        ? "brown.main"
                        : "primary.main",
                }}
              >
                {item.type === "burger" ? (
                  renderBurgerCustomization(item)
                ) : item.type === "pizza" ? (
                  renderPizzaCustomization(item)
                ) : (
                  <Box>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {item.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.description}
                    </Typography>
                    <Alert severity="info" sx={{ mt: 2 }}>
                      This item cannot be customized.
                    </Alert>
                  </Box>
                )}
              </Paper>
            ))}

            {/* Order Summary */}
            <Paper sx={{ p: 3, mt: 2 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Order Summary
              </Typography>

              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Base Deal Price:</Typography>
                <Typography variant="body2">
                  Rs. {(dealPrice * dealQuantity).toFixed(2)}
                </Typography>
              </Box>

              {extrasTotal > 0 && (
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Customizations:</Typography>
                  <Typography variant="body2" color="success.main">
                    +Rs. {(extrasTotal * dealQuantity).toFixed(2)}
                  </Typography>
                </Box>
              )}

              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Total:</Typography>
                <Typography variant="body2">
                  Rs. {finalTotal.toFixed(2)}
                </Typography>
              </Box>

              {discountAmount > 0 && (
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography
                    variant="body2"
                    color="error.main"
                    fontWeight="bold"
                  >
                    Deal Discount:
                  </Typography>
                  <Typography
                    variant="body2"
                    color="error.main"
                    fontWeight="bold"
                  >
                    -Rs. {discountAmount.toFixed(2)}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 1 }} />

              <Box display="flex" justifyContent="space-between">
                <Typography variant="subtitle1" fontWeight="bold">
                  Grand Total:
                </Typography>
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  color="primary"
                >
                  Rs. {finalTotal.toFixed(2)}
                </Typography>
              </Box>
            </Paper>
          </Box>
        );

      case 2: // Review & Confirm
        return (
          <Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Review Your Order
            </Typography>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h6" color="primary.main" fontWeight="bold">
                  {deal.title || deal.name}
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  Quantity: {dealQuantity}
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Items in your deal:
              </Typography>

              {dealItems.map((item, index) => {
                const itemCustomization = customization[item.id] || {};
                const itemTotal = calculateItemTotal(item);

                return (
                  <Box
                    key={item.id}
                    mb={3}
                    pb={2}
                    borderBottom={
                      index < dealItems.length - 1 ? "1px dashed #ddd" : "none"
                    }
                  >
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="start"
                    >
                      <Box flex={1}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {item.name} × {dealQuantity}
                        </Typography>

                        <Box ml={2} mt={1}>
                          {/* Size */}
                          {itemCustomization.selectedSize && (
                            <Typography variant="body2" color="text.secondary">
                              • Size:{" "}
                              {itemCustomization.selectedSize.toUpperCase()}
                            </Typography>
                          )}

                          {/* Crust for pizza */}
                          {item.type === "pizza" &&
                            itemCustomization.selectedCrust && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                • Crust: {itemCustomization.selectedCrust}
                              </Typography>
                            )}

                          {/* Toppings for pizza */}
                          {item.type === "pizza" &&
                            itemCustomization.selectedToppings &&
                            itemCustomization.selectedToppings.length > 0 && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                • Toppings:{" "}
                                {itemCustomization.selectedToppings
                                  .map((toppingId) => {
                                    const topping =
                                      item.options?.toppings?.find(
                                        (t) => t.id === toppingId,
                                      );
                                    return topping?.name;
                                  })
                                  .filter(Boolean)
                                  .join(", ")}
                              </Typography>
                            )}

                          {/* Addons for burger */}
                          {item.type === "burger" &&
                            itemCustomization.selectedAddons &&
                            itemCustomization.selectedAddons.length > 0 && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                • Extras:{" "}
                                {itemCustomization.selectedAddons
                                  .map((addonId) => {
                                    const addon = item.options?.addons?.find(
                                      (a) => a.id === addonId,
                                    );
                                    return addon?.name;
                                  })
                                  .filter(Boolean)
                                  .join(", ")}
                              </Typography>
                            )}
                        </Box>
                      </Box>

                      <Box textAlign="right">
                        <Typography
                          variant="subtitle2"
                          fontWeight="bold"
                          color="primary"
                        >
                          Rs. {itemTotal.toFixed(2)} each
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Rs. {(itemTotal * dealQuantity).toFixed(2)} total
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })}

              <Divider sx={{ my: 2 }} />

              {/* Price Summary */}
              <Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body1">Base Deal Price:</Typography>
                  <Typography variant="body1">
                    Rs. {(dealPrice * dealQuantity).toFixed(2)}
                  </Typography>
                </Box>

                {extrasTotal > 0 && (
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body1">Customizations:</Typography>
                    <Typography variant="body1" color="success.main">
                      +Rs. {(extrasTotal * dealQuantity).toFixed(2)}
                    </Typography>
                  </Box>
                )}

                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body1">Total:</Typography>
                  <Typography variant="body1">
                    Rs. {finalTotal.toFixed(2)}
                  </Typography>
                </Box>

                {discountAmount > 0 && (
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography
                      variant="body1"
                      color="error.main"
                      fontWeight="bold"
                    >
                      Deal Discount:
                    </Typography>
                    <Typography
                      variant="body1"
                      color="error.main"
                      fontWeight="bold"
                    >
                      -Rs. {discountAmount.toFixed(2)}
                    </Typography>
                  </Box>
                )}

                <Divider sx={{ my: 1 }} />

                <Box display="flex" justifyContent="space-between">
                  <Typography variant="h6">Grand Total:</Typography>
                  <Typography
                    variant="h6"
                    color="primary.main"
                    fontWeight="bold"
                  >
                    Rs. {finalTotal.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            <Alert severity="success">
              <Box display="flex" alignItems="center">
                <Restaurant sx={{ mr: 1 }} />
                <Typography variant="body2">
                  Prepared by{" "}
                  <strong>
                    {deal.restaurant_name || deal.restaurant || "Restaurant"}
                  </strong>
                </Typography>
              </Box>
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  if (!deal) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm">
        <DialogContent>
          <Alert severity="error">No deal data available</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  const finalTotal = calculateFinalTotal();

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: "90vh",
          },
        }}
      >
        <DialogTitle sx={{ bgcolor: "primary.main", color: "white", py: 2 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h5" fontWeight="bold">
              {existingCustomization ? "Edit Your Deal" : "Customize Your Deal"}
            </Typography>
            <IconButton onClick={onClose} size="small" sx={{ color: "white" }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 3 }}>
          <Box mb={3}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          {renderStepContent()}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, pt: 2, bgcolor: "grey.50" }}>
          <Box
            display="flex"
            justifyContent="space-between"
            width="100%"
            alignItems="center"
          >
            <Box>
              {activeStep === steps.length - 1 && (
                <Typography variant="h6" color="primary.main" fontWeight="bold">
                  Rs. {finalTotal.toFixed(2)}
                </Typography>
              )}
            </Box>

            <Box display="flex" gap={2}>
              <Button
                onClick={handleBack}
                disabled={activeStep === 0}
                variant="outlined"
              >
                Back
              </Button>

              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleAddToCart}
                  startIcon={<ShoppingCart />}
                  size="large"
                  sx={{
                    bgcolor: "primary.main",
                    px: 4,
                  }}
                >
                  {existingCustomization ? "Update Order" : "Add to Cart"}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowForward />}
                  size="large"
                >
                  Continue
                </Button>
              )}
            </Box>
          </Box>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success">{successMessage}</Alert>
      </Snackbar>
    </>
  );
};

export default DealDialog;