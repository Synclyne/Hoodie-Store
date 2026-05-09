import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { ToastProvider } from '../components/Toast';
import { WishlistProvider } from '../context/WishlistContext';
import { SettingsProvider } from '../context/SettingsContext';

export default function AppProviders({ children }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <WishlistProvider>
          <SettingsProvider>
            <CartProvider>{children}</CartProvider>
          </SettingsProvider>
        </WishlistProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
