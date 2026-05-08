import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();
export const useWishlist = () => useContext(WishlistContext);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!user) { setItems([]); return; }
    try {
      const res = await api.get('/wishlist');
      setItems(res.data.products || []);
    } catch { setItems([]); }
  }, [user]);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  const toggle = async (productId) => {
    if (!user) return { needsLogin: true };
    try {
      const res = await api.post(`/wishlist/${productId}`);
      await fetchWishlist();
      return { action: res.data.action };
    } catch { return { error: true }; }
  };

  const isWishlisted = (productId) => items.some(p => p._id === productId);

  return (
    <WishlistContext.Provider value={{ items, loading, toggle, isWishlisted, fetchWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}