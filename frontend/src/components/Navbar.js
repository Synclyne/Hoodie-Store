import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import useMediaQuery from '../hooks/useMediaQuery';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { itemCount, setCartOpen } = useCart();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [accountOpen,   setAccountOpen]   = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen,    setSearchOpen]    = useState(false);
  const [searchQuery,   setSearchQuery]   = useState('');

  const CATEGORIES = [
    { label: 'Hoodies',     value: 'hoodie'     },
    { label: 'Sweatshirts', value: 'sweatshirt' },
    { label: 'Outwear',     value: 'outwear'    },
    { label: 'Athletic',    value: 'athletic'   },
    { label: 'Shoes',       value: 'shoes'      },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    setSearchOpen(false);
    setSearchQuery('');
    setMobileNavOpen(false);
  };

  const handleLogout = () => {
    logout();
    setAccountOpen(false);
    setMobileNavOpen(false);
    navigate('/');
  };

  return (
    <>
      {/* Announcement bar */}
      <div style={s.announce}>
        {settings.freeShippingText || 'FREE SHIPPING ON ORDERS OVER KSh 5,000'} ✦ NEW COLLECTION NOW LIVE
      </div>

      {/* Main nav */}
      <nav style={s.nav}>

        {/* LEFT: hamburger on mobile, category links on desktop */}
        {isMobile ? (
          <button style={s.iconBtn} onClick={() => setMobileNavOpen(o => !o)} aria-label="Menu">
            <span style={{ fontSize: 22, lineHeight: 1 }}>{mobileNavOpen ? '✕' : '☰'}</span>
          </button>
        ) : (
          <div style={s.navLeft}>
            {CATEGORIES.map(cat => (
              <Link key={cat.value} to={`/shop/${cat.value}`} style={s.navLink}>{cat.label}</Link>
            ))}
            <Link to="/shop" style={{ ...s.navLink, color: '#e03030', fontWeight: 700 }}>
              NEW <span style={s.hotBadge}>HOT</span>
            </Link>
          </div>
        )}

        {/* CENTER: logo */}
        <Link to="/" style={s.logo}>
          {settings.logoUrl ? <img src={settings.logoUrl} alt={settings.storeName || 'Store'} style={{ maxHeight: 34, maxWidth: 150, objectFit: 'contain' }} /> : (settings.storeName || 'HOODIE')}
        </Link>

        {/* RIGHT: search, account, cart */}
        <div style={s.navRight}>
          <button style={s.iconBtn} onClick={() => setSearchOpen(o => !o)} aria-label="Search">🔍</button>

          {user ? (
            <div style={{ position: 'relative' }}>
              <button style={s.iconBtn} onClick={() => setAccountOpen(o => !o)}>👤</button>
              {accountOpen && (
                <>
                  <div style={s.dropOverlay} onClick={() => setAccountOpen(false)} />
                  <div style={s.dropdown}>
                    <div style={s.dropHead}>Hi, {user.firstName}</div>
                    <Link to="/account"        style={s.dropItem} onClick={() => setAccountOpen(false)}>My Account</Link>
                    <Link to="/account/orders" style={s.dropItem} onClick={() => setAccountOpen(false)}>My Orders</Link>
                    <Link to="/wishlist"        style={s.dropItem} onClick={() => setAccountOpen(false)}>Wishlist</Link>
                    {isAdmin && (
                      <Link to="/admin" style={{ ...s.dropItem, color: '#e03030' }} onClick={() => setAccountOpen(false)}>Admin Panel</Link>
                    )}
                    <button style={s.dropBtn} onClick={handleLogout}>Sign Out</button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link to="/login" style={s.iconBtn}>👤</Link>
          )}

          <button style={s.iconBtn} onClick={() => user ? setCartOpen(true) : navigate('/login')} aria-label="Cart">
            🛍️
            {itemCount > 0 && <span style={s.cartBadge}>{itemCount}</span>}
          </button>
        </div>
      </nav>

      {/* Search bar */}
      {searchOpen && (
        <div style={s.searchBar}>
          <form onSubmit={handleSearch} style={s.searchForm}>
            <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search products..." style={s.searchInput} />
            <button type="submit" style={s.searchBtn}>SEARCH</button>
            <button type="button" style={s.searchClose} onClick={() => setSearchOpen(false)}>✕</button>
          </form>
        </div>
      )}

      {/* Mobile nav drawer */}
      {mobileNavOpen && (
        <>
          <div style={s.mobileOverlay} onClick={() => setMobileNavOpen(false)} />
          <div style={s.mobileDrawer}>
            {/* Search inside drawer */}
            <form onSubmit={handleSearch} style={{ padding: '16px', borderBottom: '1px solid #d0cdc9', display: 'flex', gap: 8 }}>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..." style={{ ...s.searchInput, flex: 1, fontSize: 12 }} />
              <button type="submit" style={{ ...s.searchBtn, padding: '10px 14px' }}>→</button>
            </form>

            {/* Shop links */}
            <div style={s.drawerSection}>
              <p style={s.drawerLabel}>SHOP</p>
              {CATEGORIES.map(cat => (
                <Link key={cat.value} to={`/shop/${cat.value}`} style={s.drawerLink} onClick={() => setMobileNavOpen(false)}>
                  {cat.label}
                </Link>
              ))}
              <Link to="/shop" style={{ ...s.drawerLink, color: '#e03030' }} onClick={() => setMobileNavOpen(false)}>
                New Arrivals 🔥
              </Link>
            </div>

            {/* Account links */}
            <div style={s.drawerSection}>
              <p style={s.drawerLabel}>ACCOUNT</p>
              {user ? (
                <>
                  <Link to="/account"        style={s.drawerLink} onClick={() => setMobileNavOpen(false)}>My Account</Link>
                  <Link to="/account/orders" style={s.drawerLink} onClick={() => setMobileNavOpen(false)}>My Orders</Link>
                  <Link to="/wishlist"        style={s.drawerLink} onClick={() => setMobileNavOpen(false)}>Wishlist 🤍</Link>
                  {isAdmin && <Link to="/admin" style={{ ...s.drawerLink, color: '#e03030' }} onClick={() => setMobileNavOpen(false)}>Admin Panel</Link>}
                  <button style={s.drawerBtn} onClick={handleLogout}>Sign Out</button>
                </>
              ) : (
                <>
                  <Link to="/login"    style={s.drawerLink} onClick={() => setMobileNavOpen(false)}>Sign In</Link>
                  <Link to="/register" style={s.drawerLink} onClick={() => setMobileNavOpen(false)}>Create Account</Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

const s = {
  announce: { background: '#0a0a0a', color: '#f5f3ef', textAlign: 'center', padding: '7px 12px', fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 2 },
  nav: { position: 'sticky', top: 0, zIndex: 100, background: '#f5f3ef', borderBottom: '1px solid #d0cdc9', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  navLeft: { display: 'flex', alignItems: 'center', gap: 20 },
  navLink: { fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#0a0a0a', textDecoration: 'none' },
  hotBadge: { background: '#e03030', color: '#fff', padding: '1px 4px', fontSize: 8, marginLeft: 3 },
  logo: { fontFamily: 'Anton, sans-serif', fontSize: 24, letterSpacing: 6, color: '#0a0a0a', textDecoration: 'none', position: 'absolute', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' },
  navRight: { display: 'flex', alignItems: 'center', gap: 8 },
  iconBtn: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', position: 'relative', padding: 4, lineHeight: 1 },
  cartBadge: { position: 'absolute', top: -4, right: -4, background: '#0a0a0a', color: '#f5f3ef', fontFamily: 'Space Mono, monospace', fontSize: 9, width: 17, height: 17, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  dropOverlay: { position: 'fixed', inset: 0, zIndex: 200 },
  dropdown: { position: 'absolute', top: '100%', right: 0, background: '#f5f3ef', border: '1px solid #d0cdc9', minWidth: 180, zIndex: 300, boxShadow: '0 4px 20px rgba(0,0,0,.1)', padding: '8px 0' },
  dropHead: { fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888', padding: '8px 16px 4px', letterSpacing: 1 },
  dropItem: { display: 'block', padding: '8px 16px', fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#0a0a0a', textDecoration: 'none', letterSpacing: 1 },
  dropBtn: { display: 'block', width: '100%', padding: '8px 16px', fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', letterSpacing: 1 },
  searchBar: { background: '#f5f3ef', borderBottom: '1px solid #d0cdc9', padding: '12px 16px', zIndex: 99, position: 'relative' },
  searchForm: { display: 'flex', maxWidth: 600, margin: '0 auto', gap: 8 },
  searchInput: { flex: 1, border: '1px solid #0a0a0a', padding: '10px 14px', fontFamily: 'Space Mono, monospace', fontSize: 11, background: 'transparent', outline: 'none', minWidth: 0 },
  searchBtn: { fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 1, padding: '10px 18px', background: '#0a0a0a', color: '#f5f3ef', border: '1px solid #0a0a0a', cursor: 'pointer', whiteSpace: 'nowrap' },
  searchClose: { fontFamily: 'Space Mono, monospace', fontSize: 10, padding: '10px 14px', background: 'transparent', color: '#888', border: '1px solid #d0cdc9', cursor: 'pointer' },
  mobileOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 400 },
  mobileDrawer: { position: 'fixed', top: 0, left: 0, bottom: 0, width: '82%', maxWidth: 320, background: '#f5f3ef', zIndex: 500, overflowY: 'auto', boxShadow: '4px 0 24px rgba(0,0,0,.15)', display: 'flex', flexDirection: 'column' },
  drawerSection: { padding: '20px 20px 8px' },
  drawerLabel: { fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 2, color: '#888', marginBottom: 10 },
  drawerLink: { display: 'block', fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#0a0a0a', textDecoration: 'none', letterSpacing: 1, padding: '10px 0', borderBottom: '1px solid #f0ede9' },
  drawerBtn: { display: 'block', fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#888', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: 1, padding: '10px 0', textAlign: 'left', width: '100%', borderBottom: '1px solid #f0ede9' },
};
