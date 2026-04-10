import API_BASE_URL from "../config/api";

// services/orderService.js
const ORDER_API_BASE_URL = `${API_BASE_URL}/api`;

export const orderService = {
  // Get order by ID
  async getOrderById(orderId) {
    try {
      const response = await fetch(`${ORDER_API_BASE_URL}/orders/${orderId}`);
      const data = await response.json();
      console.log("OrderService: Fetched order by ID:", data);
      return data;
    } catch (error) {
      console.error("OrderService: Error fetching order by ID:", error);
      throw error;
    }
  },

  // Get current order (latest)
  async getCurrentOrder() {
    try {
      const response = await fetch(`${ORDER_API_BASE_URL}/order/current`);
      const data = await response.json();
      console.log("OrderService: Fetched current order:", data);
      return data;
    } catch (error) {
      console.error("OrderService: Error fetching current order:", error);
      throw error;
    }
  },

  // Create new order
  async createOrder(orderData) {
    try {
      const response = await fetch(`${ORDER_API_BASE_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });
      const data = await response.json();
      console.log("OrderService: Created order:", data);
      return data;
    } catch (error) {
      console.error("OrderService: Error creating order:", error);
      throw error;
    }
  },

  // Get order status
  async getOrderStatus(orderId) {
    try {
      const response = await fetch(
        `${ORDER_API_BASE_URL}/orders/${orderId}/status`,
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("OrderService: Error fetching order status:", error);
      throw error;
    }
  },

  // Get user orders
  async getUserOrders(userId) {
    try {
      const response = await fetch(
        `${ORDER_API_BASE_URL}/users/${userId}/orders`,
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("OrderService: Error fetching user orders:", error);
      throw error;
    }
  },
};
