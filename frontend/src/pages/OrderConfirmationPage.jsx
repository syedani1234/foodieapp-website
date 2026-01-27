import API_BASE_URL from './config/api'
import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Alert,
  Grid,
  CircularProgress,
  Snackbar,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Container,
  Avatar,
  Badge,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  IconButton,
  CardMedia
} from "@mui/material";
import {
  CheckCircle,
  AccessTime,
  LocalShipping,
  Home,
  Receipt,
  Share,
  Download,
  Phone,
  LocationOn,
  Restaurant,
  Payment,
  Schedule,
  Refresh,
  Warning,
  BugReport,
  Error,
  Info,
  Storage,
  Fastfood,
  RestaurantMenu,
  CreditCard,
  DeliveryDining,
  Timer,
  QrCode,
  ContentCopy,
  Print,
  ArrowBack,
  Replay,
  CheckCircleOutline,
  ErrorOutline,
  AttachMoney,
  ReceiptLong,
  ShoppingCart,
  Person,
  EmojiFoodBeverage,
  SoupKitchen,
  Kitchen,
  LocalPizza,
  LocalCafe,
  LocalDining,
  CopyAll,
  WhatsApp,
  Telegram,
  Facebook,
  Twitter,
  Sms
} from "@mui/icons-material";

const API_BASE_URL = API_BASE_URL;

// Helper function to safely format numbers
const formatCurrency = (amount, defaultValue = "0.00") => {
  if (amount === null || amount === undefined) return defaultValue;
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(num) ? `â‚¹${num.toFixed(2)}` : defaultValue;
};

// Helper function to safely get number
const safeNumber = (value, defaultValue = 0) => {
  if (value === null || value === undefined) return defaultValue;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) ? num : defaultValue;
};

export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(30);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info"
  });
  const [debugDialogOpen, setDebugDialogOpen] = useState(false);
  const [debugResults, setDebugResults] = useState([]);
  const [shareMenuAnchor, setShareMenuAnchor] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const lastOrderId = localStorage.getItem('lastOrderId');
    const lastOrderNumber = localStorage.getItem('lastOrderNumber');
    
    console.log(`ðŸ“Š OrderConfirmationPage mounted`);
    console.log(`- URL orderId: ${orderId}`);
    console.log(`- localStorage ID: ${lastOrderId}`);
    console.log(`- localStorage Number: ${lastOrderNumber}`);
    
    // If no orderId in URL but we have saved data, redirect with that ID
    if (!orderId && lastOrderId) {
      console.log(`ðŸ”„ Redirecting to saved order ID: ${lastOrderId}`);
      navigate(`/order-confirmation/${lastOrderId}`, { replace: true });
      return;
    }
    
    loadOrderData();
    
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);

    return () => clearInterval(timer);
  }, [orderId, navigate]);

  useEffect(() => {
    if (countdown === 0 && orderDetails && orderDetails.orderNumber) {
      setTimeout(() => {
        navigate(`/track-order/${orderDetails.orderNumber}`);
      }, 1000);
    }
  }, [countdown, orderDetails, navigate]);

  const loadOrderData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`ðŸ” Starting to load order data...`);
      
      let orderData = null;
      let dataSource = "unknown";
      const debugLog = [];
      
      // Try multiple sources to get order data
      const sources = [
        { name: 'api_direct', url: `${API_BASE_URL}/api/orders/${orderId}`, condition: !!orderId },
        { name: 'api_current', url: `${API_BASE_URL}/api/order/current`, condition: true },
        { name: 'api_summary', url: `${API_BASE_URL}/api/get-order-summary/${orderId}`, condition: !!orderId }
      ];
      
      for (const source of sources) {
        if (!source.condition || orderData) continue;
        
        console.log(`ðŸ“¡ Attempting: ${source.name}`);
        try {
          const response = await fetch(source.url);
          const data = await response.json();
          
          if (response.ok && data.success && data.order) {
            orderData = normalizeOrderData(data.order);
            dataSource = source.name;
            
            // Save to localStorage
            localStorage.setItem('lastOrder', JSON.stringify(orderData));
            localStorage.setItem('lastOrderId', orderData.id);
            localStorage.setItem('lastOrderNumber', orderData.orderNumber);
            
            debugLog.push({
              step: debugLog.length + 1,
              method: source.name,
              status: "success",
              orderNumber: orderData.orderNumber
            });
            break;
          } else {
            debugLog.push({
              step: debugLog.length + 1,
              method: source.name,
              status: "failed",
              error: data.error || "No order data"
            });
          }
        } catch (apiError) {
          debugLog.push({
            step: debugLog.length + 1,
            method: source.name,
            status: "error",
            error: apiError.message
          });
        }
      }
      
      // Check localStorage if still no data
      if (!orderData) {
        const lastOrderJson = localStorage.getItem('lastOrder');
        if (lastOrderJson) {
          try {
            const parsed = JSON.parse(lastOrderJson);
            if (parsed && parsed.id) {
              orderData = normalizeOrderData(parsed);
              dataSource = "localStorage";
              debugLog.push({
                step: debugLog.length + 1,
                method: "localStorage",
                status: "success"
              });
            }
          } catch (e) {
            debugLog.push({
              step: debugLog.length + 1,
              method: "localStorage",
              status: "parse_error"
            });
          }
        }
      }
      
      // Set order data
      if (orderData) {
        console.log(`âœ… Order data loaded from: ${dataSource}`);
        setOrderDetails(orderData);
        setDebugResults(debugLog);
        
        setSnackbar({
          open: true,
          message: `Order #${orderData.orderNumber} loaded successfully!`,
          severity: "success"
        });
      } else {
        throw new Error("Could not load order from any source");
      }
      
    } catch (err) {
      console.error("âŒ Error loading order:", err);
      setError(err.message);
      
      setSnackbar({
        open: true,
        message: "Failed to load order details",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  // Normalize order data to ensure proper types
  const normalizeOrderData = (order) => {
    if (!order) return null;
    
    // Ensure totalAmount is a number
    const totalAmount = safeNumber(order.totalAmount, 0);
    
    // Ensure breakdown exists and has numbers
    const breakdown = order.breakdown || {};
    const subtotal = safeNumber(breakdown.subtotal, totalAmount * 0.85);
    const tax = safeNumber(breakdown.tax, subtotal * 0.15);
    const deliveryFee = safeNumber(breakdown.deliveryFee, 50);
    
    // Ensure items array exists
    const items = Array.isArray(order.items) ? order.items.map(item => ({
      ...item,
      id: item.id || Math.random(),
      name: item.name || "Unknown Item",
      description: item.description || "",
      quantity: safeNumber(item.quantity, 1),
      price: safeNumber(item.price, 0),
      total: safeNumber(item.total, safeNumber(item.price, 0) * safeNumber(item.quantity, 1))
    })) : [];
    
    // Ensure restaurant object
    const restaurant = order.restaurant || {
      name: "Restaurant",
      address: "Address not available",
      deliveryTime: "30-45 min",
      image: null
    };
    
    return {
      ...order,
      id: order.id || orderId || `ORD${Date.now()}`,
      orderNumber: order.orderNumber || order.id || "N/A",
      totalAmount,
      status: order.status || "preparing",
      paymentMethod: order.paymentMethod || "Credit Card",
      deliveryAddress: order.deliveryAddress || "Delivery address not available",
      estimatedDeliveryTime: order.estimatedDeliveryTime || order.estimatedDelivery || "30-40 minutes",
      itemsCount: safeNumber(order.itemsCount, items.length),
      items,
      restaurant,
      breakdown: {
        subtotal,
        tax,
        deliveryFee,
        total: subtotal + tax + deliveryFee
      },
      orderDate: order.orderDate || order.createdAt || new Date().toISOString(),
      _source: order._source || "database"
    };
  };

  const runDatabaseDiagnostics = async () => {
    console.log("ðŸ§ª Running database diagnostics...");
    
    const tests = [];
    
    // Test API endpoints
    const endpoints = [
      { name: "API Health", url: `${API_BASE_URL}/api/health` },
      { name: "Database Status", url: `${API_BASE_URL}/api/database-status` },
      { name: "Current Order", url: `${API_BASE_URL}/api/order/current` },
      { name: `Order ${orderId}`, url: `${API_BASE_URL}/api/orders/${orderId}`, condition: !!orderId },
      { name: "Debug Orders", url: `${API_BASE_URL}/api/debug/orders` }
    ];
    
    for (const endpoint of endpoints) {
      if (endpoint.condition === false) continue;
      
      try {
        const response = await fetch(endpoint.url);
        const data = await response.json();
        
        tests.push({
          test: endpoint.name,
          status: response.status,
          success: response.ok && (data.success !== false),
          message: data.message || data.error || "OK"
        });
      } catch (err) {
        tests.push({
          test: endpoint.name,
          status: "ERROR",
          success: false,
          message: err.message
        });
      }
    }
    
    // Test localStorage
    tests.push({
      test: "LocalStorage",
      status: "OK",
      success: true,
      message: `Has order: ${!!localStorage.getItem('lastOrder')}`
    });
    
    setDebugResults(tests);
    setDebugDialogOpen(true);
    
    return tests;
  };

  const fixLocalStorage = () => {
    if (orderDetails) {
      localStorage.setItem('lastOrder', JSON.stringify(orderDetails));
      localStorage.setItem('lastOrderId', orderDetails.id);
      localStorage.setItem('lastOrderNumber', orderDetails.orderNumber);
      
      setSnackbar({
        open: true,
        message: `Order ${orderDetails.orderNumber} saved to localStorage`,
        severity: "success"
      });
    }
  };

  const handleRetry = () => {
    loadOrderData();
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleCloseDebugDialog = () => {
    setDebugDialogOpen(false);
  };

  const getStatusColor = (status) => {
    if (!status) return 'default';
    switch (status.toLowerCase()) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'preparing': return 'warning';
      case 'ready': return 'primary';
      case 'out_for_delivery': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const handleShare = (platform) => {
    const order = orderDetails;
    const shareText = `ðŸŽ‰ Just ordered from ${order.restaurant.name}!\nOrder #${order.orderNumber}\nTotal: ${formatCurrency(order.totalAmount)}\nStatus: ${order.status}\nEstimated Delivery: ${order.estimatedDeliveryTime}`;
    
    let url = '';
    switch (platform) {
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(shareText)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.href)}`;
        break;
      case 'sms':
        url = `sms:?body=${encodeURIComponent(shareText)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(shareText);
        setSnackbar({
          open: true,
          message: 'Order details copied to clipboard!',
          severity: 'success'
        });
        return;
    }
    
    if (url) {
      window.open(url, '_blank');
    }
    
    setShareMenuAnchor(null);
  };

  const handleDownloadReceipt = () => {
    const order = orderDetails;
    const receipt = `
========================================
        FOODIE APP - ORDER RECEIPT
========================================
Order Number: #${order.orderNumber}
Order Date: ${new Date(order.orderDate).toLocaleDateString()}
Order Time: ${new Date(order.orderDate).toLocaleTimeString()}
Order Status: ${order.status}

RESTAURANT INFORMATION:
${order.restaurant.name}
${order.restaurant.address}

DELIVERY INFORMATION:
${order.deliveryAddress}
Estimated Delivery: ${order.estimatedDeliveryTime}

ORDER ITEMS:
${order.items.map(item => `  â€¢ ${item.quantity}x ${item.name} - ${formatCurrency(item.total)}`).join('\n')}

PRICE BREAKDOWN:
  Subtotal: ${formatCurrency(order.breakdown.subtotal)}
  Tax (15%): ${formatCurrency(order.breakdown.tax)}
  Delivery Fee: ${formatCurrency(order.breakdown.deliveryFee)}
  ---------------------------------
  TOTAL AMOUNT: ${formatCurrency(order.totalAmount)}

Payment Method: ${order.paymentMethod}

Thank you for ordering with Foodie App!
We hope you enjoy your meal! ðŸ•ðŸ”ðŸ

========================================
    `.trim();
    
    const blob = new Blob([receipt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-receipt-${order.orderNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setSnackbar({
      open: true,
      message: 'Receipt downloaded successfully!',
      severity: 'success'
    });
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <CircularProgress size={80} sx={{ mb: 4, color: '#4CAF50' }} />
          <Typography variant="h5" fontWeight="medium" color="text.secondary" gutterBottom>
            Loading your order details...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Order ID: {orderId || 'Loading...'}
          </Typography>
          <LinearProgress sx={{ width: '60%', mx: 'auto', height: 8, borderRadius: 4 }} />
        </motion.div>
      </Container>
    );
  }

  if (error && !orderDetails) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Error sx={{ fontSize: 100, color: 'error.main', mb: 3 }} />
          <Typography variant="h4" fontWeight="bold" color="error" gutterBottom>
            Order Not Found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            {error || "We couldn't find your order. Please check the order ID and try again."}
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              onClick={handleRetry}
              variant="contained"
              size="large"
              startIcon={<Refresh />}
            >
              Try Again
            </Button>
            <Button
              onClick={fixLocalStorage}
              variant="outlined"
              size="large"
              startIcon={<Storage />}
            >
              Check Saved Orders
            </Button>
            <Button
              component={Link}
              to="/"
              variant="outlined"
              size="large"
              startIcon={<Home />}
            >
              Back to Home
            </Button>
          </Stack>
        </motion.div>
      </Container>
    );
  }

  // Use the normalized order data
  const order = orderDetails;
  if (!order) return null;

  const statusColor = getStatusColor(order.status);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Success Animation */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
        style={{ textAlign: 'center', marginBottom: 40 }}
      >
        <Box
          sx={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 40px rgba(76, 175, 80, 0.3)',
            mb: 3,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              width: '140%',
              height: '140%',
              borderRadius: '50%',
              border: '2px solid rgba(76, 175, 80, 0.2)',
              animation: 'pulse 2s infinite'
            }
          }}
        >
          <CheckCircle sx={{ fontSize: 60, color: 'white' }} />
        </Box>
        
        <Typography variant="h3" fontWeight="bold" color="success.main" gutterBottom>
          Order Confirmed! ðŸŽ‰
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
          Your food is being prepared with love â¤ï¸
        </Typography>
        
        <Paper
          elevation={2}
          sx={{
            display: 'inline-block',
            p: 3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)',
            border: '1px solid #e0e0e0',
            mb: 3
          }}
        >
          <Typography variant="h5" fontWeight="bold" color="text.primary">
            Order #{order.orderNumber}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Placed on {new Date(order.orderDate).toLocaleDateString()} at {new Date(order.orderDate).toLocaleTimeString()}
          </Typography>
        </Paper>
        
        <Stack direction="row" spacing={2} justifyContent="center" alignItems="center" sx={{ mt: 2 }}>
          <Chip
            icon={<AccessTime />}
            label={order.status.toUpperCase()}
            color={statusColor}
            variant="filled"
            sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}
          />
          {countdown > 0 && (
            <Typography variant="body2" color="text.secondary">
              Auto-tracking in {countdown}s
            </Typography>
          )}
        </Stack>
      </motion.div>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Order Details Card */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 3 }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                  <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ReceiptLong sx={{ color: 'primary.main' }} /> Order Summary
                  </Typography>
                  <Badge badgeContent={order.itemsCount} color="primary">
                    <ShoppingCart color="action" />
                  </Badge>
                </Box>
                
                <Divider sx={{ mb: 3 }} />
                
                {/* Order Items */}
                <TableContainer>
                  <Table>
                    <TableBody>
                      {order.items.map((item, index) => (
                        <TableRow key={index} hover>
                          <TableCell sx={{ width: '70%' }}>
                            <Box display="flex" alignItems="center" gap={2}>
                              <Avatar sx={{ bgcolor: 'primary.light' }}>
                                <Fastfood />
                              </Avatar>
                              <Box>
                                <Typography variant="body1" fontWeight="medium">
                                  {item.quantity}x {item.name}
                                </Typography>
                                {item.description && (
                                  <Typography variant="body2" color="text.secondary">
                                    {item.description}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body1" fontWeight="bold">
                              {formatCurrency(item.total)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatCurrency(item.price)} each
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Price Breakdown */}
                <Paper sx={{ mt: 4, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Price Breakdown
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell>Subtotal</TableCell>
                          <TableCell align="right">{formatCurrency(order.breakdown.subtotal)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Tax (15%)</TableCell>
                          <TableCell align="right">{formatCurrency(order.breakdown.tax)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Delivery Fee</TableCell>
                          <TableCell align="right">{formatCurrency(order.breakdown.deliveryFee)}</TableCell>
                        </TableRow>
                        <TableRow sx={{ '& td': { borderBottom: 'none' } }}>
                          <TableCell>
                            <Typography variant="h6" fontWeight="bold">Total Amount</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="h5" fontWeight="bold" color="success.main">
                              {formatCurrency(order.totalAmount)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Sidebar Cards */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* Restaurant Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RestaurantMenu sx={{ color: 'primary.main' }} /> Restaurant
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Avatar
                      src={order.restaurant.image}
                      sx={{ width: 60, height: 60, bgcolor: 'primary.light' }}
                    >
                      <Restaurant />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {order.restaurant.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        <LocationOn fontSize="small" /> {order.restaurant.address}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Alert severity="info" icon={<Timer />} sx={{ borderRadius: 2 }}>
                    <Typography variant="body2">
                      Delivery time: {order.restaurant.deliveryTime}
                    </Typography>
                  </Alert>
                </CardContent>
              </Card>
            </motion.div>

            {/* Delivery Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DeliveryDining sx={{ color: 'primary.main' }} /> Delivery Information
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Delivery Address
                      </Typography>
                      <Box display="flex" alignItems="flex-start" gap={1}>
                        <LocationOn color="primary" />
                        <Typography variant="body1">
                          {order.deliveryAddress}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Estimated Delivery
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Schedule color="primary" />
                        <Typography variant="body1" fontWeight="medium">
                          {order.estimatedDeliveryTime}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Payment Method
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <CreditCard color="primary" />
                        <Typography variant="body1">
                          {order.paymentMethod}
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>

            {/* Order Status Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTime sx={{ color: 'primary.main' }} /> Order Status
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  
                  <Stack spacing={2}>
                    {['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'].map((step, index) => {
                      const isActive = step === order.status;
                      const isCompleted = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered']
                        .indexOf(step) <= ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered']
                        .indexOf(order.status);
                      
                      return (
                        <Box key={step} display="flex" alignItems="center" gap={2}>
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: isCompleted ? 'primary.main' : 'grey.200',
                              color: isCompleted ? 'white' : 'grey.600',
                              border: isActive ? '2px solid' : 'none',
                              borderColor: 'primary.main'
                            }}
                          >
                            {isCompleted ? <CheckCircleOutline /> : index + 1}
                          </Box>
                          <Box flex={1}>
                            <Typography variant="body2" fontWeight={isActive ? "bold" : "normal"}>
                              {step.charAt(0).toUpperCase() + step.slice(1).replace('_', ' ')}
                            </Typography>
                            {isActive && (
                              <Typography variant="caption" color="text.secondary">
                                Current status
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          </Stack>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        style={{ marginTop: 40 }}
      >
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            What would you like to do next?
          </Typography>
          
          <Grid container spacing={2} justifyContent="center" sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                startIcon={<LocalShipping />}
                onClick={() => navigate(`/track-order/${order.orderNumber}`)}
                sx={{ py: 1.5 }}
              >
                Track Your Order
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                size="large"
                startIcon={<Share />}
                onClick={() => handleShare('copy')}
                sx={{ py: 1.5 }}
              >
                Share Order
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                size="large"
                startIcon={<Download />}
                onClick={handleDownloadReceipt}
                sx={{ py: 1.5 }}
              >
                Download Receipt
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                color="secondary"
                size="large"
                startIcon={<Home />}
                component={Link}
                to="/"
                sx={{ py: 1.5 }}
              >
                Back to Home
              </Button>
            </Grid>
          </Grid>
          
          {/* Quick Share Options */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Share on:
            </Typography>
            <Stack direction="row" spacing={1} justifyContent="center">
              <IconButton color="success" onClick={() => handleShare('whatsapp')}>
                <WhatsApp />
              </IconButton>
              <IconButton color="info" onClick={() => handleShare('telegram')}>
                <Telegram />
              </IconButton>
              <IconButton color="primary" onClick={() => handleShare('facebook')}>
                <Facebook />
              </IconButton>
              <IconButton color="info" onClick={() => handleShare('twitter')}>
                <Twitter />
              </IconButton>
              <IconButton color="default" onClick={() => handleShare('sms')}>
                <Sms />
              </IconButton>
            </Stack>
          </Box>
        </Paper>
      </motion.div>

      {/* Debug Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <Paper sx={{ mt: 4, p: 3, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px dashed #ccc' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BugReport /> Debug Tools
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Order ID: {order.id} | Source: {order._source}
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                onClick={runDatabaseDiagnostics}
                startIcon={<Info />}
              >
                Run Diagnostics
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                onClick={fixLocalStorage}
                startIcon={<Storage />}
              >
                Fix LocalStorage
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                onClick={handleRetry}
                startIcon={<Refresh />}
              >
                Reload Data
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                component={Link}
                to="/api-test"
                startIcon={<BugReport />}
              >
                API Test
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </motion.div>

      {/* Debug Dialog */}
      <Dialog open={debugDialogOpen} onClose={handleCloseDebugDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BugReport /> Diagnostic Results
        </DialogTitle>
        <DialogContent>
          <List>
            {debugResults.map((result, index) => (
              <ListItem key={index} sx={{ 
                mb: 1, 
                p: 2, 
                borderRadius: 2,
                bgcolor: result.success ? '#e8f5e8' : '#ffebee',
                border: '1px solid',
                borderColor: result.success ? '#c8e6c9' : '#ffcdd2'
              }}>
                <ListItemIcon>
                  {result.success ? 
                    <CheckCircleOutline color="success" /> : 
                    <ErrorOutline color="error" />
                  }
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="subtitle2" fontWeight="bold">
                      {result.test}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography variant="body2">
                        Status: {result.status} {result.success ? 'âœ…' : 'âŒ'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {result.message}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDebugDialog}>Close</Button>
          <Button onClick={fixLocalStorage} variant="contained" startIcon={<Storage />}>
            Fix LocalStorage
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          elevation={6}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Add CSS for pulse animation */}
      <style jsx global>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
    </Container>
  );
}


