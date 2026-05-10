import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from '../next/ReactRouterCompat';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import useMediaQuery from '../hooks/useMediaQuery';
import { ProductGridSkeleton } from '../components/Skeleton';

const CATEGORIES = [
  { value: 'all',        label: 'All'         },
  { value: 'hoodie',     label: 'Hoodies'     },
  { value: 'sweatshirt', label: 'Sweatshirts' },
  { value: 'outwear',    label: 'Outwear'     },
  { value: 'athletic',   label: 'Athletic'    },
  { value: 'shoes',      label: 'Shoes'       },
];
const GENDERS      = ['All', 'Men', 'Women', 'Unisex'];
const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest'            },
  { value: 'price-asc',  label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'popular',    label: 'Most Popular'       },
];

const GENDER_SLUGS = ['men', 'women', 'unisex', 'kids'];
const BADGES = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'limited', label: 'Limited' },
  { value: 'bestseller', label: 'Bestseller' },
  { value: 'sale', label: 'Sale' },
];

export default function ShopPage() {
  const { category: routeCategory } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useMediaQuery('(max-width: 768px)');

  // If the route param is a gender (men/women/unisex/kids), treat it as gender filter not category
  const routeIsGender   = routeCategory && GENDER_SLUGS.includes(routeCategory);
  const initCategory    = routeIsGender ? 'all' : (routeCategory || 'all');
  const initGender      = routeIsGender ? routeCategory : 'all';

  const [products,    setProducts]    = useState([]);
  const [pagination,  setPagination]  = useState({});
  const [loading,     setLoading]     = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [category,    setCategory]    = useState(initCategory);
  const [gender,      setGender]      = useState(initGender);
  const [priceCap,    setPriceCap]    = useState(10000);
  const [maxPrice,    setMaxPrice]    = useState(10000);
  const [sort,        setSort]        = useState('newest');
  const [page,        setPage]        = useState(1);
  const search = searchParams.get('search') || '';
  const queryBadge = searchParams.get('badge') || 'all';
  const [badge,       setBadge]       = useState(BADGES.some(b => b.value === queryBadge) ? queryBadge : 'all');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        sort, page, limit: 12,
        ...(category !== 'all' && { category }),
        ...(gender   !== 'all' && { gender: gender.toLowerCase() }),
        ...(badge    !== 'all' && { badge }),
        ...(maxPrice < priceCap && { maxPrice }),
        ...(search             && { search }),
      };
      const res = await api.get('/products', { params });
      setProducts(res.data.products);
      setPagination(res.data.pagination);
    } finally { setLoading(false); }
  }, [category, gender, badge, maxPrice, priceCap, sort, page, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => {
    api.get('/products/meta/price-range')
      .then(res => {
        const cap = Math.max(10000, Math.ceil(Number(res.data.maxPrice || 10000) / 500) * 500);
        setPriceCap(cap);
        setMaxPrice(cap);
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (routeCategory) {
      if (GENDER_SLUGS.includes(routeCategory)) {
        setGender(routeCategory);
        setCategory('all');
      } else {
        setCategory(routeCategory);
        setGender('all');
      }
    }
  }, [routeCategory]);
  useEffect(() => {
    const nextBadge = BADGES.some(b => b.value === queryBadge) ? queryBadge : 'all';
    setBadge(nextBadge);
    setPage(1);
  }, [queryBadge]);

  const clearFilters = () => {
    setCategory('all');
    setGender('all');
    setBadge('all');
    setMaxPrice(priceCap);
    setPage(1);
    if (searchParams.get('badge')) setSearchParams(new URLSearchParams(), { replace: true });
  };

  const Filters = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: isMobile ? '16px 20px 32px' : '24px 20px' }}>
      <div>
        <h4 style={s.filterTitle}>CATEGORY</h4>
        {CATEGORIES.map(cat => (
          <button key={cat.value} onClick={() => { setCategory(cat.value); setPage(1); if (isMobile) setFiltersOpen(false); }}
            style={{ ...s.filterBtn, fontWeight: category === cat.value ? 700 : 400, color: category === cat.value ? '#0a0a0a' : '#666' }}>
            {cat.label}
          </button>
        ))}
      </div>
      <div>
        <h4 style={s.filterTitle}>TAGS</h4>
        {BADGES.map(b => (
          <button key={b.value} onClick={() => { setBadge(b.value); setPage(1); if (isMobile) setFiltersOpen(false); }}
            style={{ ...s.filterBtn, fontWeight: badge === b.value ? 700 : 400, color: badge === b.value ? '#0a0a0a' : '#666' }}>
            {b.label}
          </button>
        ))}
      </div>
      <div>
        <h4 style={s.filterTitle}>GENDER</h4>
        {GENDERS.map(g => (
          <button key={g} onClick={() => { setGender(g.toLowerCase()); setPage(1); }}
            style={{ ...s.filterBtn, fontWeight: gender === g.toLowerCase() ? 700 : 400, color: gender === g.toLowerCase() ? '#0a0a0a' : '#666' }}>
            {g}
          </button>
        ))}
      </div>
      <div>
        <h4 style={s.filterTitle}>MAX PRICE</h4>
        <input type="range" min={500} max={priceCap} step={500} value={maxPrice}
          onChange={e => { setMaxPrice(Number(e.target.value)); setPage(1); }}
          style={{ width: '100%', accentColor: '#0a0a0a' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', marginTop: 4 }}>
          <span>KSh 0</span><span>KSh {maxPrice.toLocaleString()}</span>
        </div>
      </div>
      <button style={s.clearBtn} onClick={clearFilters}>CLEAR FILTERS</button>
    </div>
  );

  return (
    <div style={{ background: '#f5f3ef', minHeight: '80vh' }}>
      <div style={s.header}>
        <h1 style={s.h1}>{search ? `"${search}"` : badge !== 'all' ? badge.toUpperCase() : category === 'all' ? 'SHOP ALL' : category.toUpperCase()}</h1>
        <span style={s.count}>{pagination.total || 0} products</span>
      </div>

      {/* Mobile toolbar */}
      {isMobile && (
        <div style={s.mobileBar}>
          <button style={s.filterToggle} onClick={() => setFiltersOpen(true)}>⚙ FILTERS</button>
          <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }} style={s.sortSelect}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      )}

      {/* Mobile filter bottom sheet */}
      {isMobile && filtersOpen && (
        <>
          <div style={s.filterOverlay} onClick={() => setFiltersOpen(false)} />
          <div style={s.filterSheet}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #d0cdc9' }}>
              <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 22 }}>FILTERS</span>
              <button style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }} onClick={() => setFiltersOpen(false)}>✕</button>
            </div>
            <Filters />
          </div>
        </>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '220px 1fr' }}>
        {!isMobile && (
          <aside style={s.sidebar}>
            <Filters />
          </aside>
        )}

        <div style={s.products}>
          {!isMobile && (
            <div style={s.toolbar}>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888' }}>
                {search && `Results for "${search}"`}
              </span>
              <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }} style={s.sortSelect}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          )}

          {loading ? (
            <ProductGridSkeleton count={isMobile ? 6 : 8} />
          ) : products.length === 0 ? (
            <div style={s.empty}>No products found.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 1, background: '#d0cdc9', marginBottom: 32 }}>
              {products.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          )}

          {pagination.pages > 1 && (
            <div style={s.pagination}>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => { setPage(p); window.scrollTo(0, 0); }}
                  style={{ ...s.pageBtn, ...(page === p ? { background: '#0a0a0a', color: '#f5f3ef', borderColor: '#0a0a0a' } : {}) }}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  header: { padding: '28px 16px 16px', borderBottom: '1px solid #d0cdc9' },
  h1: { fontFamily: 'Anton, sans-serif', fontSize: 'clamp(36px,10vw,100px)', lineHeight: .9, marginBottom: 6 },
  count: { fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888' },
  mobileBar: { display: 'flex', gap: 8, padding: '10px 16px', borderBottom: '1px solid #d0cdc9' },
  filterToggle: { fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 1, padding: '8px 14px', border: '1px solid #0a0a0a', background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap' },
  filterOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 400 },
  filterSheet: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#f5f3ef', zIndex: 500, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 -4px 24px rgba(0,0,0,.15)', borderRadius: '12px 12px 0 0' },
  sidebar: { borderRight: '1px solid #d0cdc9', position: 'sticky', top: 56, height: 'calc(100vh - 56px)', overflowY: 'auto' },
  filterTitle: { fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 2, marginBottom: 10, borderBottom: '1px solid #d0cdc9', paddingBottom: 7 },
  filterBtn: { display: 'block', fontFamily: 'Space Mono, monospace', fontSize: 10, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 6, letterSpacing: 1, padding: '2px 0', textAlign: 'left', width: '100%' },
  clearBtn: { fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', background: 'none', border: '1px solid #d0cdc9', padding: '7px 12px', cursor: 'pointer', width: '100%' },
  products: { padding: '16px' },
  toolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sortSelect: { fontFamily: 'Space Mono, monospace', fontSize: 10, border: '1px solid #d0cdc9', padding: '7px 10px', background: '#f5f3ef', cursor: 'pointer', outline: 'none', flex: 1 },
  loading: { padding: 60, textAlign: 'center', fontFamily: 'Space Mono, monospace', fontSize: 12, color: '#888' },
  empty: { padding: 60, textAlign: 'center', fontFamily: 'Space Mono, monospace', fontSize: 12, color: '#888' },
  pagination: { display: 'flex', justifyContent: 'center', gap: 6, padding: '24px 0', flexWrap: 'wrap' },
  pageBtn: { fontFamily: 'Space Mono, monospace', fontSize: 10, border: '1px solid #d0cdc9', padding: '8px 14px', background: 'transparent', cursor: 'pointer' },
};
