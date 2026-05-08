import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider }          from './context/CartContext';
import { ToastProvider }         from './components/Toast';

// Layout
import Navbar     from './components/Navbar';
import CartDrawer from './components/CartDrawer';

// Customer pages
import HomePage         from './pages/HomePage';
import ShopPage         from './pages/ShopPage';
import ProductPage      from './pages/ProductPage';
import CartPage         from './pages/CartPage';
import CheckoutPage     from './pages/CheckoutPage';
import OrderConfirmPage from './pages/OrderConfirmPage';
import AccountPage      from './pages/AccountPage';
import OrdersPage       from './pages/OrdersPage';
import LoginPage        from './pages/LoginPage';
import RegisterPage     from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage  from './pages/ResetPasswordPage';
import WishlistPage     from './pages/WishlistPage';
import AdminCoupons     from './pages/admin/AdminCoupons';
import AdminShipping    from './pages/admin/AdminShipping';
import { WishlistProvider } from './context/WishlistContext';

// Admin pages
import AdminDashboard   from './pages/admin/AdminDashboard';
import AdminProducts    from './pages/admin/AdminProducts';
import AdminProductEdit from './pages/admin/AdminProductEdit';
import AdminOrders      from './pages/admin/AdminOrders';
import AdminHomepage    from './pages/admin/AdminHomepage';
import AdminStaff       from './pages/admin/AdminStaff';
import AdminSettings    from './pages/admin/AdminSettings';
import AdminMedia       from './pages/admin/AdminMedia';
import { SettingsProvider, useSettings } from './context/SettingsContext';

// ── Route guards ──────────────────────────────────────────
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading">Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children, permission }) {
  const { user, loading, hasPermission } = useAuth();
  if (loading) return <div className="page-loading">Loading...</div>;
  if (!user)                 return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/"      replace />;
  if (permission && !hasPermission(permission)) return <Navigate to="/admin" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading">Loading...</div>;
  return user ? <Navigate to="/account" replace /> : children;
}

// ── App shell (must be inside all providers) ─────────────
function AppShell() {
  const { settings } = useSettings();

  return (
    <>
      <Navbar />
      <CartDrawer />
      <Routes>
        {/* Public */}
        <Route path="/"               element={<HomePage />} />
        <Route path="/shop"            element={<ShopPage />} />
        <Route path="/shop/:category"  element={<ShopPage />} />
        <Route path="/product/:slug"  element={<ProductPage />} />

        {/* Auth */}
        <Route path="/login"           element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register"        element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />
        <Route path="/wishlist"        element={<PrivateRoute><WishlistPage /></PrivateRoute>} />

        {/* Protected customer */}
        <Route path="/cart"                element={<PrivateRoute><CartPage /></PrivateRoute>} />
        <Route path="/checkout"            element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
        <Route path="/order-confirmed/:id" element={<PrivateRoute><OrderConfirmPage /></PrivateRoute>} />
        <Route path="/account"             element={<PrivateRoute><AccountPage /></PrivateRoute>} />
        <Route path="/account/orders"      element={<PrivateRoute><OrdersPage /></PrivateRoute>} />

        {/* Admin */}
        <Route path="/admin"                   element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/coupons"           element={<AdminRoute permission="coupons"><AdminCoupons /></AdminRoute>} />
        <Route path="/admin/shipping"          element={<AdminRoute permission="shipping"><AdminShipping /></AdminRoute>} />
        <Route path="/admin/products"          element={<AdminRoute permission="products"><AdminProducts /></AdminRoute>} />
        <Route path="/admin/products/new"      element={<AdminRoute permission="products"><AdminProductEdit /></AdminRoute>} />
        <Route path="/admin/products/:id/edit" element={<AdminRoute permission="products"><AdminProductEdit /></AdminRoute>} />
        <Route path="/admin/orders"            element={<AdminRoute permission="orders"><AdminOrders /></AdminRoute>} />
        <Route path="/admin/homepage"          element={<AdminRoute permission="homepage"><AdminHomepage /></AdminRoute>} />
        <Route path="/admin/media"             element={<AdminRoute permission="products"><AdminMedia /></AdminRoute>} />
        <Route path="/admin/staff"             element={<AdminRoute permission="staff"><AdminStaff /></AdminRoute>} />
        <Route path="/admin/settings"          element={<AdminRoute permission="settings"><AdminSettings /></AdminRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <a
        href={`https://wa.me/${settings.whatsappNumber || '254700000000'}?text=${encodeURIComponent('Hi! I have a question about an order.')}`}
        target="_blank" rel="noreferrer"
        style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 999, width: 52, height: 52, borderRadius: '50%', background: '#25d366', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(37,211,102,.45)', textDecoration: 'none' }}
        title="Chat on WhatsApp"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </>
  );
}

// ── Root ──────────────────────────────────────────────────
// Note: Stripe Elements is initialised inside CheckoutPage only,
// because PaymentElement requires clientSecret at Elements mount time.
export default function App() {
  return (
    <BrowserRouter basename={process.env.PUBLIC_URL || '/'}>
      <ToastProvider>
        <AuthProvider>
          <WishlistProvider>
            <SettingsProvider>
              <CartProvider>
                <AppShell />
              </CartProvider>
            </SettingsProvider>
          </WishlistProvider>
        </AuthProvider>
      </ToastProvider>
      {/* Floating WhatsApp button */}
      
    </BrowserRouter>
  );
}
