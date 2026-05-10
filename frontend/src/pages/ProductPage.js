import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from '../next/ReactRouterCompat';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
import useMediaQuery from '../hooks/useMediaQuery';
import { useSettings } from '../context/SettingsContext';
import { PageSkeleton } from '../components/Skeleton';

const fmt = (n) => `KSh ${Number(n).toLocaleString()}`;
const sameOption = (a, b) => String(a || '').trim() === String(b || '').trim();
const firstAvailableVariant = (product) =>
  product?.variants?.find(v => v.stock > 0) || product?.variants?.[0] || null;

export default function ProductPage({ initialProduct = null }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { toggle: toggleWishlist, isWishlisted } = useWishlist();
  const { settings } = useSettings();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [product,       setProduct]       = useState(initialProduct);
  const [related,       setRelated]       = useState([]);
  const [loading,       setLoading]       = useState(!initialProduct);
  const initialVariant = firstAvailableVariant(initialProduct);
  const [selectedSize,  setSelectedSize]  = useState(initialVariant?.size || null);
  const [selectedColor, setSelectedColor] = useState(initialVariant?.color || null);
  const [qty,           setQty]           = useState(1);
  const [activeImg,     setActiveImg]     = useState(0);
  const [adding,        setAdding]        = useState(false);
  const [addError,      setAddError]      = useState('');
  const [addSuccess,    setAddSuccess]    = useState('');
  const [activeTab,     setActiveTab]     = useState(null);
  const [review,        setReview]        = useState({ rating: 5, comment: '' });
  const [reviewMsg,     setReviewMsg]     = useState('');
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [notifyEmail,   setNotifyEmail]   = useState('');
  const [notifyMsg,     setNotifyMsg]     = useState('');
  const [wishlistMsg,   setWishlistMsg]   = useState('');
  const [currentUrl,    setCurrentUrl]    = useState('');

  useEffect(() => {
    if (initialProduct && initialProduct.slug === slug) {
      setProduct(initialProduct);
      setLoading(false);
      api.get(`/products/${slug}/related`).then(r => setRelated(r.data.products)).catch(() => {});
      try {
        const viewed = JSON.parse(localStorage.getItem('hoodie_viewed') || '[]');
        const filtered = viewed.filter(id => id !== initialProduct._id).slice(0, 9);
        localStorage.setItem('hoodie_viewed', JSON.stringify([initialProduct._id, ...filtered]));
      } catch {}
      return;
    }

    setLoading(true);
    setAddError(''); setAddSuccess('');
    setSelectedSize(null); setSelectedColor(null);
    setQty(1); setActiveImg(0);
    api.get(`/products/${slug}`)
      .then(res => {
        setProduct(res.data.product);
        const first = firstAvailableVariant(res.data.product);
        if (first) {
          setSelectedColor(first.color);
          setSelectedSize(first.size);
        }
        // Track recently viewed
        try {
          const viewed = JSON.parse(localStorage.getItem('hoodie_viewed') || '[]');
          const filtered = viewed.filter(id => id !== res.data.product._id).slice(0, 9);
          localStorage.setItem('hoodie_viewed', JSON.stringify([res.data.product._id, ...filtered]));
        } catch {}
      })
      .catch(() => navigate('/shop'))
      .finally(() => setLoading(false));
    api.get(`/products/${slug}/related`).then(r => setRelated(r.data.products)).catch(() => {});
  }, [slug, navigate, initialProduct]);

  useEffect(() => {
    if (!product?.variants?.length) return;

    const currentVariant = product.variants.find(
      v => sameOption(v.size, selectedSize) && sameOption(v.color, selectedColor) && v.stock > 0
    );
    if (currentVariant) return;

    const first = firstAvailableVariant(product);
    if (!first) return;
    setSelectedColor(first.color);
    setSelectedSize(first.size);
  }, [product, selectedColor, selectedSize]);

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  const handleWishlistToggle = async () => {
    if (!user) { navigate('/login'); return; }
    const res = await toggleWishlist(product._id);
    if (res?.needsLogin) { navigate('/login'); return; }
    setWishlistMsg(res?.action === 'added' ? 'Saved to wishlist!' : 'Removed from wishlist');
    setTimeout(() => setWishlistMsg(''), 2500);
  };

  const handleStockNotify = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/stock-notify', { productId: product._id, variantId: selectedVariant?._id, email: notifyEmail || user?.email, name: user?.firstName });
      setNotifyMsg(res.data.message);
    } catch (err) {
      setNotifyMsg(err.response?.data?.error || 'Failed. Please try again.');
    }
  };

  if (loading) return <PageSkeleton variant="product" />;
  if (!product) return null;

  const primaryImg = product.images?.[activeImg];
  const availableSizes = product.variants
    .filter(v => !selectedColor || sameOption(v.color, selectedColor))
    .map(v => ({ size: v.size, stock: v.stock }));
  const uniqueColors = [...new Map(product.variants.map(v => [v.color, { color: v.color, colorHex: v.colorHex, stock: product.variants.filter(x => x.color === v.color).reduce((s, x) => s + x.stock, 0) }])).values()];
  const selectedVariant = product.variants.find(
    v => sameOption(v.size, selectedSize) && sameOption(v.color, selectedColor)
  );
  const discount = product.comparePrice ? Math.round((1 - product.price / product.comparePrice) * 100) : null;
  const handleAddToCart = async () => {
    if (!user) { navigate('/login'); return; }
    if (!selectedSize) { setAddError('Please select a size.'); return; }
    if (!selectedVariant) { setAddError('This combination is unavailable.'); return; }
    if (selectedVariant.stock < qty) { setAddError(`Only ${selectedVariant.stock} in stock.`); return; }
    setAdding(true); setAddError('');
    const res = await addToCart(product._id, selectedVariant._id, qty);
    setAdding(false);
    if (res.success) { setAddSuccess('Added to cart!'); setTimeout(() => setAddSuccess(''), 3000); }
    else setAddError(res.error);
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    try {
      const res = await api.post(`/products/${product._id}/reviews`, review);
      setReviewMsg(`Saved: ${res.data.message || 'Review submitted for approval.'}`);
      setReview({ rating: 5, comment: '' });
      setTimeout(() => setReviewMsg(''), 5000);
    } catch (err) { setReviewMsg(err.response?.data?.error || 'Failed.'); }
  };

  return (
    <div style={{ background: '#f5f3ef' }}>
      {/* Breadcrumb */}
      <div style={s.breadcrumb}>
        <Link to="/" style={s.crumb}>Home</Link> ›
        <Link to="/shop" style={s.crumb}> Shop</Link> ›
        <Link to={`/shop/${product.category}`} style={s.crumb}> {product.category}</Link> ›
        <span style={{ color: '#0a0a0a' }}> {product.name}</span>
      </div>

      {/* Main body — stacks on mobile */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', minHeight: isMobile ? 'auto' : '80vh' }}>

        {/* Gallery */}
        <div style={{ ...s.gallery, position: isMobile ? 'relative' : 'sticky', top: isMobile ? 'auto' : 56, height: isMobile ? 'auto' : 'calc(100vh - 56px)' }}>
          {/* Main image */}
          <div style={{ position: 'relative', flex: 1 }}>
            <div style={s.mainImg}>
              {primaryImg
                ? <img src={primaryImg.url} alt={primaryImg.alt || product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 80, opacity: .15 }}>👕</div>}
              {product.badge && (
                <span style={{ ...s.badge, background: product.badge === 'sale' ? '#e07000' : product.badge === 'new' ? '#0a0a0a' : '#e03030' }}>
                  {product.badge.toUpperCase()}
                </span>
              )}
            </div>

            {/* Left / right arrows on main image */}
            {product.images?.length > 1 && (
              <>
                <button onClick={() => setActiveImg(i => (i - 1 + product.images.length) % product.images.length)} style={{ ...s.arrowBtn, left: 10 }} aria-label="Previous">‹</button>
                <button onClick={() => setActiveImg(i => (i + 1) % product.images.length)}                          style={{ ...s.arrowBtn, right: 10 }} aria-label="Next">›</button>
              </>
            )}
          </div>

          {/* Thumbnail strip — always visible, all images shown */}
          {product.images?.length > 1 && (
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, flexShrink: 0 }}>
              {product.images.map((img, i) => (
                <div key={i} onClick={() => setActiveImg(i)} style={{ ...s.thumb, borderColor: activeImg === i ? '#0a0a0a' : 'transparent', flexShrink: 0 }}>
                  <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ ...s.info, borderLeft: isMobile ? 'none' : '1px solid #d0cdc9', borderTop: isMobile ? '1px solid #d0cdc9' : 'none' }}>
          <p style={s.catTag}>{product.category.toUpperCase()} / {product.gender.toUpperCase()}</p>
          <h1 style={s.name}>{product.name}</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ color: '#f0a500', letterSpacing: 2 }}>{'★'.repeat(Math.round(product.rating))}{'☆'.repeat(5 - Math.round(product.rating))}</span>
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888' }}>({product.numReviews})</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'Anton, sans-serif', fontSize: isMobile ? 28 : 36, color: product.comparePrice ? '#e03030' : '#0a0a0a' }}>{fmt(product.price)}</span>
            {product.comparePrice && <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 13, color: '#888', textDecoration: 'line-through' }}>{fmt(product.comparePrice)}</span>}
            {discount && <span style={{ background: '#e03030', color: '#fff', fontFamily: 'Space Mono, monospace', fontSize: 10, padding: '3px 8px' }}>−{discount}%</span>}
          </div>

          <p style={s.desc}>{product.description}</p>

          {/* Colour */}
          <div style={{ marginBottom: 18 }}>
            <p style={s.optLabel}>COLOUR — <strong>{selectedColor || 'Select'}</strong></p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {uniqueColors.map(c => (
                <div key={c.color} title={c.color} onClick={() => { setSelectedColor(c.color); setSelectedSize(null); }}
                  style={{ width: 30, height: 30, borderRadius: '50%', background: c.colorHex, cursor: 'pointer', outline: selectedColor === c.color ? '2px solid #0a0a0a' : '2px solid transparent', outlineOffset: 3, opacity: c.stock === 0 ? .3 : 1 }} />
              ))}
            </div>
          </div>

          {/* Size */}
          <div style={{ marginBottom: 18 }}>
            <p style={s.optLabel}>SIZE — <strong>{selectedSize || 'Select'}</strong></p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {availableSizes.map(v => (
                <button key={v.size} disabled={v.stock === 0} onClick={() => setSelectedSize(v.size)}
                  style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, border: '1px solid', padding: '8px 12px', cursor: v.stock === 0 ? 'not-allowed' : 'pointer', transition: 'all .15s', background: selectedSize === v.size ? '#0a0a0a' : 'transparent', color: selectedSize === v.size ? '#f5f3ef' : v.stock === 0 ? '#d0cdc9' : '#0a0a0a', borderColor: selectedSize === v.size ? '#0a0a0a' : v.stock === 0 ? '#d0cdc9' : '#0a0a0a', textDecoration: v.stock === 0 ? 'line-through' : 'none' }}>
                  {v.size}
                </button>
              ))}
            </div>
          </div>

          {selectedVariant && selectedVariant.stock <= 5 && selectedVariant.stock > 0 && (
            <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#e07000', marginBottom: 12 }}>⚠ Only {selectedVariant.stock} left</p>
          )}

          {/* Qty */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <p style={{ ...s.optLabel, margin: 0 }}>QTY</p>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #0a0a0a' }}>
              <button style={s.qtyBtn} onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 13, width: 44, textAlign: 'center', borderLeft: '1px solid #0a0a0a', borderRight: '1px solid #0a0a0a', height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{qty}</span>
              <button style={s.qtyBtn} onClick={() => setQty(q => Math.min(10, q + 1))}>+</button>
            </div>
          </div>

          {addError   && <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#e03030', marginBottom: 10 }}>{addError}</p>}
          {addSuccess && <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#2a7a2a', marginBottom: 10 }}>✓ {addSuccess}</p>}
          {wishlistMsg && <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#2a7a2a', marginBottom: 10 }}>✓ {wishlistMsg}</p>}

          {/* Add to cart + Wishlist */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button onClick={handleAddToCart} disabled={adding || product.totalStock === 0}
              style={{ ...s.addBtn, flex: 1, opacity: product.totalStock === 0 ? .5 : 1 }}>
              {product.totalStock === 0 ? 'OUT OF STOCK' : adding ? 'ADDING...' : 'ADD TO CART'}
            </button>
            <button onClick={handleWishlistToggle}
              style={{ width: 48, height: 48, border: '1px solid #0a0a0a', background: isWishlisted(product._id) ? '#0a0a0a' : 'transparent', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              title={isWishlisted(product._id) ? 'Remove from wishlist' : 'Save to wishlist'}
            >
              {isWishlisted(product._id) ? '❤️' : '🤍'}
            </button>
          </div>

          {/* WhatsApp order button */}
          <a
            href={`https://wa.me/${settings.whatsappNumber || '254700000000'}?text=${encodeURIComponent(`Hi! I'd like to order: *${product.name}*${selectedSize ? ` — Size: ${selectedSize}` : ''}${selectedColor ? `, Color: ${selectedColor}` : ''}${currentUrl ? `\nLink: ${currentUrl}` : ''}`)}`}
            target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', border: '1px solid #25d366', color: '#25d366', background: 'transparent', fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 1, textDecoration: 'none', marginBottom: 20 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#25d366" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            ORDER VIA WHATSAPP
          </a>

          {/* Out of stock notify */}
          {product.totalStock === 0 && (
            <div style={{ marginBottom: 20, padding: '14px', border: '1px solid #d0cdc9' }}>
              <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, marginBottom: 10 }}>GET NOTIFIED WHEN BACK IN STOCK</p>
              {notifyMsg ? (
                <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#2a7a2a' }}>✓ {notifyMsg}</p>
              ) : (
                <form onSubmit={handleStockNotify} style={{ display: 'flex', gap: 8 }}>
                  <input type="email" value={notifyEmail} onChange={e => setNotifyEmail(e.target.value)} required={!user} placeholder={user?.email || 'your@email.com'} style={{ ...s.input, flex: 1 }} />
                  <button type="submit" style={{ ...s.addBtn, padding: '10px 14px', whiteSpace: 'nowrap' }}>NOTIFY ME</button>
                </form>
              )}
            </div>
          )}

          {/* Size guide link */}
          <button onClick={() => setShowSizeGuide(true)} style={{ background: 'none', border: 'none', fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', textDecoration: 'underline', cursor: 'pointer', marginBottom: 16, display: 'block' }}>
            📏 Size guide
          </button>

          {/* Size guide modal */}
          {showSizeGuide && <SizeGuideModal onClose={() => setShowSizeGuide(false)} category={product.category} />}

          {/* Accordions */}
          <div style={{ borderTop: '1px solid #d0cdc9' }}>
            {[
              { key: 'details',  label: 'DETAILS & FIT',      content: product.details || 'Contact us for more details.' },
              { key: 'shipping', label: 'SHIPPING & RETURNS',  content: 'Free shipping on orders over KSh 5,000. Standard delivery 3–5 business days. Free returns within 30 days.' },
              { key: 'care',     label: 'MATERIALS & CARE',    content: 'Machine wash cold, gentle cycle. Tumble dry low. Do not bleach.' },
            ].map(tab => (
              <div key={tab.key} style={{ borderBottom: '1px solid #d0cdc9' }}>
                <button onClick={() => setActiveTab(activeTab === tab.key ? null : tab.key)}
                  style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '12px 0', fontFamily: 'Space Mono, monospace', fontSize: 10, background: 'none', border: 'none', cursor: 'pointer', letterSpacing: 1 }}>
                  <span>{tab.label}</span><span>{activeTab === tab.key ? '−' : '+'}</span>
                </button>
                {activeTab === tab.key && (
                  <p style={{ fontSize: 13, color: '#888', lineHeight: 1.8, paddingBottom: 14 }}>{tab.content}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section style={{ padding: isMobile ? '40px 16px' : '60px 28px', borderTop: '1px solid #d0cdc9' }}>
        <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(32px,6vw,48px)', marginBottom: 28 }}>REVIEWS ({product.numReviews})</h2>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 40 }}>
          <div>
            <h3 style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, marginBottom: 14 }}>WRITE A REVIEW</h3>
            {reviewMsg && <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: reviewMsg.startsWith('Saved:') ? '#2a7a2a' : '#e03030', marginBottom: 12 }}>{reviewMsg}</p>}
            <form onSubmit={handleReview} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={s.formLabel}>RATING</label>
                <select value={review.rating} onChange={e => setReview(r => ({ ...r, rating: Number(e.target.value) }))} style={s.input}>
                  {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Star{n !== 1 ? 's' : ''}</option>)}
                </select>
              </div>
              <div>
                <label style={s.formLabel}>COMMENT</label>
                <textarea value={review.comment} onChange={e => setReview(r => ({ ...r, comment: e.target.value }))} rows={4} style={{ ...s.input, resize: 'vertical' }} placeholder="Tell us about the fit, quality..." />
              </div>
              <button type="submit" style={s.submitBtn}>SUBMIT REVIEW</button>
            </form>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {product.reviews?.length === 0 && <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#888' }}>No reviews yet.</p>}
            {product.reviews?.map(r => (
              <div key={r._id} style={{ borderBottom: '1px solid #d0cdc9', paddingBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <strong style={{ fontSize: 13 }}>{r.name}</strong>
                  <span style={{ color: '#f0a500' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                </div>
                <p style={{ fontSize: 13, color: '#888', lineHeight: 1.7 }}>{r.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section style={{ paddingBottom: 48 }}>
          <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(28px,5vw,60px)', padding: '0 16px 20px' }}>YOU MAY ALSO LIKE</h2>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 1, background: '#d0cdc9' }}>
            {related.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}

      <RecentlyViewedSection currentId={product._id} isMobile={isMobile} />
    </div>
  );
}

function RecentlyViewedSection({ currentId, isMobile }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const ids = JSON.parse(localStorage.getItem('hoodie_viewed') || '[]')
      .filter(id => id !== currentId)
      .slice(0, 4);
    if (!ids.length) return;
    Promise.all(ids.map(id => api.get(`/products/id/${id}`).then(r => r.data.product).catch(() => null)))
      .then(results => setProducts(results.filter(Boolean)));
  }, [currentId]);

  if (!products.length) return null;
  return (
    <section style={{ paddingBottom: 48 }}>
      <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(28px,5vw,60px)', padding: '0 16px 20px' }}>RECENTLY VIEWED</h2>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 1, background: '#d0cdc9' }}>
        {products.map(p => <ProductCard key={p._id} product={p} />)}
      </div>
    </section>
  );
}

const s = {
  breadcrumb: { padding: '12px 16px', fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', borderBottom: '1px solid #d0cdc9', display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' },
  crumb: { color: '#888' },
  gallery: { padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 },
  mainImg: { flex: 1, overflow: 'hidden', background: '#ede9e3', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 300, aspectRatio: '1' },
  arrowBtn: { position: 'absolute', top: '50%', transform: 'translateY(-50%)', zIndex: 4, background: 'rgba(245,243,239,.88)', border: '1px solid rgba(208,205,201,.6)', backdropFilter: 'blur(4px)', width: 36, height: 36, borderRadius: '50%', fontSize: 22, lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a0a0a', fontWeight: 300 },
  badge: { position: 'absolute', top: 12, left: 12, fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#fff', padding: '3px 8px', letterSpacing: 1 },
  thumb: { width: 64, height: 64, overflow: 'hidden', cursor: 'pointer', border: '2px solid transparent', transition: 'border-color .2s', background: '#ede9e3' },
  info: { padding: '24px 16px' },
  catTag: { fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 2, color: '#888', marginBottom: 8 },
  name: { fontFamily: 'Anton, sans-serif', fontSize: 'clamp(24px,5vw,44px)', lineHeight: 1, marginBottom: 12, textTransform: 'uppercase' },
  desc: { fontSize: 13, color: '#888', lineHeight: 1.8, marginBottom: 20 },
  optLabel: { fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 1.5, marginBottom: 8 },
  qtyBtn: { background: 'none', border: 'none', width: 38, height: 40, fontSize: 16, cursor: 'pointer' },
  addBtn: { fontFamily: 'Space Mono, monospace', fontSize: 11, letterSpacing: 2, padding: 16, border: '1px solid #0a0a0a', background: '#0a0a0a', color: '#f5f3ef', cursor: 'pointer' },
  formLabel: { display: 'block', fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1.5, color: '#888', marginBottom: 6 },
  input: { width: '100%', border: '1px solid #d0cdc9', padding: '10px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: 13, background: '#f5f3ef', outline: 'none' },
  submitBtn: { fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 1, padding: '11px 18px', background: '#0a0a0a', color: '#f5f3ef', border: 'none', cursor: 'pointer', alignSelf: 'flex-start' },
};

// ─── Size Guide Modal ─────────────────────────────────────
const SIZE_GUIDE = {
  shoes: {
    headers: ['EU', 'UK', 'US (M)', 'US (W)', 'CM'],
    rows: [
      ['36','3.5','4','5.5','22.5'],['37','4','5','6','23.5'],['38','5','6','7','24'],
      ['39','6','7','8','25'],['40','6.5','7.5','8.5','25.5'],['41','7','8','9','26'],
      ['42','8','9','10','26.5'],['43','9','10','11','27.5'],['44','9.5','10.5','11.5','28'],
      ['45','10.5','11.5','13','29'],['46','11','12','13.5','29.5'],
    ],
  },
  default: {
    headers: ['SIZE', 'CHEST (cm)', 'WAIST (cm)', 'HIP (cm)', 'LENGTH (cm)'],
    rows: [
      ['XS','82–87','68–73','88–93','65'],['S','88–93','74–79','94–99','67'],
      ['M','94–99','80–85','100–105','70'],['L','100–105','86–91','106–111','72'],
      ['XL','106–111','92–97','112–117','74'],['XXL','112–119','98–105','118–125','76'],
    ],
  },
};

function SizeGuideModal({ onClose, category }) {
  const guide = category === 'shoes' ? SIZE_GUIDE.shoes : SIZE_GUIDE.default;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: '#f5f3ef', maxWidth: 540, width: '100%', maxHeight: '85vh', overflowY: 'auto', border: '1px solid #d0cdc9' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #d0cdc9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, letterSpacing: 2 }}>SIZE GUIDE</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: '16px 18px' }}>
          <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', marginBottom: 14, lineHeight: 1.7 }}>
            {category === 'shoes'
              ? 'Measurements are for foot length. When between sizes, go up.'
              : 'Measure around the fullest part. Our hoodies are cut slightly oversized — size down for a fitted look.'}
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #0a0a0a' }}>
                {guide.headers.map(h => <th key={h} style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, padding: '6px 10px', textAlign: 'left', letterSpacing: 1 }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {guide.rows.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #ede9e3', background: i % 2 === 0 ? '#faf9f7' : 'transparent' }}>
                  {row.map((cell, j) => <td key={j} style={{ fontFamily: j === 0 ? 'Space Mono, monospace' : 'DM Sans, sans-serif', fontSize: j === 0 ? 11 : 13, fontWeight: j === 0 ? 700 : 400, padding: '8px 10px' }}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
