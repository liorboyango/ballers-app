/**
 * useOrders Hook
 * Custom hook for fetching and creating orders with loading and error states.
 */
import { useState, useEffect, useCallback } from 'react';
import { getOrders, getOrderById, createOrder } from '../services/ordersApi';

/**
 * Hook to fetch user's orders
 * @param {Object} initialParams - Initial query parameters
 * @returns {Object} - { orders, pagination, loading, error, refetch }
 */
export const useOrders = (initialParams = {}) => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [params] = useState(initialParams);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getOrders(params);
      setOrders(result.orders || []);
      setPagination(result.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, pagination, loading, error, refetch: fetchOrders };
};

/**
 * Hook to fetch a single order by ID
 * @param {string} id - Order ID
 * @returns {Object} - { order, loading, error, refetch }
 */
export const useOrder = (id) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrder = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await getOrderById(id);
      setOrder(result.data || null);
    } catch (err) {
      setError(err.message || 'Failed to load order');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return { order, loading, error, refetch: fetchOrder };
};

/**
 * Hook to create an order
 * @returns {Object} - { submitOrder, loading, error, success, orderId }
 */
export const useCreateOrder = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const submitOrder = useCallback(async (orderData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    setOrderId(null);
    try {
      const result = await createOrder(orderData);
      setSuccess(true);
      setOrderId(result.order?.id || null);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to place order');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { submitOrder, loading, error, success, orderId };
};

export default useOrders;
