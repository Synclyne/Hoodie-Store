import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [] });
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) { setCart({ items: [] }); return; }
    try {
      const res = await api.get('/cart');
      setCart(res.data.cart);
    } catch (err) {
      console.error('Failed to fetch cart', err);
    }
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (productId, variantId, quantity = 1) => {
    setLoading(true);
    try {
      const res = await api.post('/cart/items', { productId, variantId, quantity });
      setCart(res.data.cart);
      setCartOpen(true);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Failed to add to cart' };
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      const res = await api.put(`/cart/items/${itemId}`, { quantity });
      setCart(res.data.cart);
    } catch (err) {
      console.error(err);
    }
  };

  const removeItem = async (itemId) => {
    try {
      const res = await api.delete(`/cart/items/${itemId}`);
      setCart(res.data.cart);
    } catch (err) {
      console.error(err);
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart');
      setCart({ items: [] });
    } catch (err) {
      console.error(err);
    }
  };

  const subtotal = cart.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
  const itemCount = cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <CartContext.Provider value={{
      cart, cartOpen, setCartOpen, loading,
      addToCart, updateQuantity, removeItem, clearCart,
      subtotal, itemCount, fetchCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
