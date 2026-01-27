import API_BASE_URL from './config/api';

// src/hooks/useDealsData.js - UPDATED VERSION
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const API_BASE_URL = API_BASE_URL;

// Fetch all deals
const fetchDeals = async () => {
  const { data } = await axios.get(`${API_BASE_URL}/api/deals`);
  return data.data || data;
};

// Fetch single deal by ID
const fetchDealById = async (id) => {
  const { data } = await axios.get(`${API_BASE_URL}/api/deals/${id}`);
  return data.data || data;
};

// Create new deal
const createDeal = async (dealData) => {
  const formData = new FormData();
  
  Object.keys(dealData).forEach(key => {
    if (key === 'image' && dealData[key] instanceof File) {
      formData.append('image', dealData[key]);
    } else if (key === 'tags' && Array.isArray(dealData[key])) {
      formData.append(key, JSON.stringify(dealData[key]));
    } else if (dealData[key] !== null && dealData[key] !== undefined) {
      formData.append(key, dealData[key]);
    }
  });

  const { data } = await axios.post(`${API_BASE_URL}/api/deals`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
};

// Update deal
const updateDeal = async ({ id, ...dealData }) => {
  const formData = new FormData();
  
  Object.keys(dealData).forEach(key => {
    if (key === 'image' && dealData[key] instanceof File) {
      formData.append('image', dealData[key]);
    } else if (key === 'tags' && Array.isArray(dealData[key])) {
      formData.append(key, JSON.stringify(dealData[key]));
    } else if (dealData[key] !== null && dealData[key] !== undefined) {
      formData.append(key, dealData[key]);
    }
  });

  const { data } = await axios.put(`${API_BASE_URL}/api/deals/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
};

// Delete deal
const deleteDeal = async (id) => {
  const { data } = await axios.delete(`${API_BASE_URL}/api/deals/${id}`);
  return data;
};

// Hook for fetching all deals
export const useDealsData = (options = {}) => {
  return useQuery({
    queryKey: ["deals"],
    queryFn: fetchDeals,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options
  });
};

// Hook for fetching single deal
export const useDealById = (id, options = {}) => {
  return useQuery({
    queryKey: ["deal", id],
    queryFn: () => fetchDealById(id),
    enabled: !!id,
    ...options
  });
};

// Hook for creating deal
export const useCreateDeal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createDeal,
    onSuccess: () => {
      queryClient.invalidateQueries(["deals"]);
    }
  });
};

// Hook for updating deal
export const useUpdateDeal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateDeal,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(["deals"]);
      queryClient.invalidateQueries(["deal", variables.id]);
    }
  });
};

// Hook for deleting deal
export const useDeleteDeal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteDeal,
    onSuccess: () => {
      queryClient.invalidateQueries(["deals"]);
    }
  });
};


