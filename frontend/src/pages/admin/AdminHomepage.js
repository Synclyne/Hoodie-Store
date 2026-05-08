import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import MediaPicker from '../../components/admin/MediaPicker';
import useMediaQuery from '../../hooks/useMediaQuery';

// ─── Constants ────────────────────────────────────────────
const PRESET_GRADIENTS = [
  { label: 'Dark',          value: 'linear-gradient(160deg,#1a1a1a,#3d3d3d)' },
  { label: 'Forest',        value: 'linear-gradient(160deg,#2d4a2d,#4a7a4a)' },
  { label: 'Cream',         value: 'linear-gradient(160deg,#c5b99a,#e8dcc8)' },
  { label: 'Winter Dark',   value: 'linear-gradient(180deg,#111,#333)'        },
  { label: 'Winter Warm',   value: 'linear-gradient(180deg,#c8b89a,#a89070)'  },
  { label: 'Summer Blue',   value: 'linear-gradient(180deg,#a8c8e8,#6090c0)'  },
  { label: 'Summer Coral',  value: 'linear-gradient(180deg,#f0b090,#e07050)'  },
  { label: 'Spring Pink',   value: 'linear-gradient(160deg,#f0d0d8,#d8a0b0)'  },
  { label: 'Autumn Orange', value: 'linear-gradient(160deg,#e8a050,#c06820)'  },
  { label: 'Navy',          value: 'linear-gradient(160deg,#1a2a4a,#2a4a8a)'  },
];

const CATEGORY_OPTIONS = ['hoodie','sweatshirt','outwear','athletic','shoes','accessories'];

// Built-in moveable sections (not Hero, not Featured Products)
const BUILTIN_SECTIONS = {
  ticker:     { label: 'Scrolling Ticker',   canDelete: false },
  cards:      { label: 'Category Cards',     canDelete: false },
  collection: { label: 'Collection Heading', canDelete: false },
  banner:     { label: 'Seasonal Banner',    canDelete: false },
};

const CUSTOM_SECTION_TYPES = [
  { value: 'product_carousel', label: 'Product Carousel',   desc: 'Horizontal scrolling product row — great for launches or collections' },
  { value: 'banner',           label: 'Two-Panel Banner',   desc: 'Two coloured panels side by side' },
  { value: 'text',             label: 'Text Block',          desc: 'Centred heading + body text'       },
  { value: 'image_text',       label: 'Image + Text',        desc: 'Image on one side, text the other' },
  { value: 'cta',              label: 'Full-Width CTA',      desc: 'Large call-to-action strip'        },
];

// ─── Main ─────────────────────────────────────────────────
export default function AdminHomepage() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [cfg,     setCfg]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');
  const [active,  setActive]  = useState('hero'); // which section is being edited

  useEffect(() => {
    api.get('/admin/homepage')
      .then(r => {
        const config = r.data.config;
        // Ensure sectionOrder exists (backwards compat with old DB records)
        if (!config.sectionOrder || !config.sectionOrder.length) {
          config.sectionOrder = ['ticker', 'cards', 'collection', 'banner'];
        }
        if (!config.heroSlides || !config.heroSlides.length) {
          config.heroSlides = [{
            tagline: config.heroTagline || 'THE BEST HOODIES ARE ONLY HERE',
            title: config.heroTitle || 'HOODIE',
            ctaLabel: config.heroCtaLabel || 'DISCOVER NOW',
            ctaLink: config.heroCtaLink || '/shop',
            category: 'hoodie',
            imageUrl: config.heroImageUrl || '',
            bgColor: 'linear-gradient(135deg,#c8c2b8,#a89f93,#d4cdc5)',
            darkText: false,
          }];
        }
        setCfg(config);
      })
      .catch(() => setError('Failed to load config.'))
      .finally(() => setLoading(false));
  }, []);

  // Deep-path setter: set('banner.heading')('value')
  const set = useCallback((path) => (value) => {
    setCfg(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  }, []);

  const setCard = (i, field, value) => setCfg(prev => ({
    ...prev,
    featuredCards: prev.featuredCards.map((c, idx) => idx === i ? { ...c, [field]: value } : c),
  }));

  const setHeroSlide = (i, field, value) => setCfg(prev => ({
    ...prev,
    heroSlides: prev.heroSlides.map((slide, idx) => idx === i ? { ...slide, [field]: value } : slide),
  }));

  const addHeroSlide = () => setCfg(prev => ({
    ...prev,
    heroSlides: [...prev.heroSlides, {
      tagline: 'THE BEST HOODIES ARE ONLY HERE',
      title: 'HOODIE',
      ctaLabel: 'DISCOVER NOW',
      ctaLink: '/shop',
      category: 'hoodie',
      imageUrl: '',
      bgColor: 'linear-gradient(135deg,#c8c2b8,#a89f93,#d4cdc5)',
      darkText: false,
    }],
  }));

  // ── Section order helpers ─────────────────────────────
  const moveSection = (key, dir) => {
    setCfg(prev => {
      const order = [...prev.sectionOrder];
      const idx = order.indexOf(key);
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= order.length) return prev;
      [order[idx], order[newIdx]] = [order[newIdx], order[idx]];
      return { ...prev, sectionOrder: order };
    });
  };

  const removeFromOrder = (key) => {
    setCfg(prev => ({
      ...prev,
      sectionOrder: prev.sectionOrder.filter(k => k !== key),
    }));
  };

  const addToOrder = (key) => {
    setCfg(prev => {
      if (prev.sectionOrder.includes(key)) return prev;
      return { ...prev, sectionOrder: [...prev.sectionOrder, key] };
    });
  };

  // ── Custom section helpers ────────────────────────────
  const addCustomSection = (type) => {
    const id = `custom_${Date.now()}`;
    const newSec = {
      id, type, visible: true,
      heading: type === 'product_carousel' ? 'NEW DROP' : 'NEW SECTION',
      subtext: '', body: '',
      bgLeft: 'linear-gradient(160deg,#1a1a1a,#3d3d3d)',
      bgRight: 'linear-gradient(160deg,#c5b99a,#e8dcc8)',
      imageUrl: '', imageSide: 'left',
      ctaLabel: 'SHOP ALL', ctaLink: '/shop',
      darkText: false, order: 0,
      productIds: [], carouselCategory: '',
    };
    setCfg(prev => ({
      ...prev,
      customSections: [...(prev.customSections || []), newSec],
      sectionOrder: [...prev.sectionOrder, id],
    }));
    setActive(id);
  };

  const updateCustomSection = (id, field, value) => setCfg(prev => ({
    ...prev,
    customSections: prev.customSections.map(s => s.id === id ? { ...s, [field]: value } : s),
  }));

  const deleteCustomSection = (id) => {
    if (!window.confirm('Delete this section?')) return;
    setCfg(prev => ({
      ...prev,
      customSections: prev.customSections.filter(s => s.id !== id),
      sectionOrder: prev.sectionOrder.filter(k => k !== id),
    }));
    setActive('hero');
  };

  const handleSave = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      await api.put('/admin/homepage', cfg);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed.');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="page-loading">Loading editor...</div>;
  if (!cfg)    return <div style={{ padding: 40, fontFamily: 'Space Mono, monospace', color: '#e03030' }}>{error || 'Failed to load.'}</div>;

  const customSections = cfg.customSections || [];
  const sectionOrder   = cfg.sectionOrder   || ['ticker','cards','collection','banner'];

  // Hidden built-in sections (in cfg but removed from order)
  const hiddenBuiltins = Object.keys(BUILTIN_SECTIONS).filter(k => !sectionOrder.includes(k));

  return (
    <div style={{ ...s.shell, ...(isMobile ? s.shellMobile : {}) }}>

      {/* ── SIDEBAR ── */}
      <aside style={{ ...s.sidebar, ...(isMobile ? s.sidebarMobile : {}) }}>
        <div style={{ padding: '14px 14px 8px', borderBottom: '1px solid #d0cdc9', flexShrink: 0 }}>
          <Link to="/admin" style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', textDecoration: 'none' }}>← DASHBOARD</Link>
          <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, letterSpacing: 2, marginTop: 6 }}>PAGE EDITOR</h2>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>

          {/* Fixed sections */}
          <p style={s.sideLabel}>FIXED (always shown)</p>
          {['hero', 'featured'].map(key => (
            <button key={key} onClick={() => setActive(key)} style={{ ...s.sideBtn, background: active === key ? '#0a0a0a' : 'transparent', color: active === key ? '#f5f3ef' : '#0a0a0a' }}>
              {key === 'hero' ? '🏠 Hero' : '⭐ Featured Products'}
            </button>
          ))}

          {/* Orderable sections */}
          <p style={s.sideLabel}>PAGE ORDER <span style={{ color: '#aaa', fontWeight: 400 }}>(drag ↑↓ to reorder)</span></p>
          {sectionOrder.map((key, idx) => {
            const isBuiltin = !!BUILTIN_SECTIONS[key];
            const customSec = !isBuiltin ? customSections.find(s => s.id === key) : null;
            const label = isBuiltin ? BUILTIN_SECTIONS[key].label : (customSec?.heading || 'Custom Section');
            const typeTag = !isBuiltin && customSec ? customSec.type : null;
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'stretch', borderBottom: '1px solid #f0ede9' }}>
                <button onClick={() => setActive(key)} style={{ ...s.sideBtn, flex: 1, textAlign: 'left', borderBottom: 'none', background: active === key ? '#0a0a0a' : 'transparent', color: active === key ? '#f5f3ef' : '#0a0a0a' }}>
                  {typeTag && <span style={{ display: 'block', fontSize: 7, color: active === key ? '#aaa' : '#888', letterSpacing: 1, textTransform: 'uppercase' }}>{typeTag}</span>}
                  {label}
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid #f0ede9', flexShrink: 0 }}>
                  <button style={s.arrowBtn} onClick={() => moveSection(key, -1)} disabled={idx === 0} title="Move up">↑</button>
                  <button style={s.arrowBtn} onClick={() => moveSection(key, 1)} disabled={idx === sectionOrder.length - 1} title="Move down">↓</button>
                </div>
                {/* Built-ins can be hidden (removed from order), custom can be deleted */}
                {isBuiltin ? (
                  <button style={{ ...s.arrowBtn, color: '#e03030', borderLeft: '1px solid #f0ede9' }} onClick={() => { removeFromOrder(key); if (active === key) setActive('hero'); }} title="Hide section">✕</button>
                ) : (
                  <button style={{ ...s.arrowBtn, color: '#e03030', borderLeft: '1px solid #f0ede9' }} onClick={() => deleteCustomSection(key)} title="Delete section">✕</button>
                )}
              </div>
            );
          })}

          {/* Restore hidden built-ins */}
          {hiddenBuiltins.length > 0 && (
            <>
              <p style={{ ...s.sideLabel, color: '#e07000' }}>HIDDEN SECTIONS</p>
              {hiddenBuiltins.map(key => (
                <button key={key} onClick={() => addToOrder(key)} style={{ ...s.sideBtn, color: '#e07000', fontSize: 8 }}>
                  + Restore {BUILTIN_SECTIONS[key].label}
                </button>
              ))}
            </>
          )}

          {/* Add custom section */}
          <p style={s.sideLabel}>ADD CUSTOM SECTION</p>
          {CUSTOM_SECTION_TYPES.map(t => (
            <button key={t.value} onClick={() => addCustomSection(t.value)} style={{ ...s.sideBtn, fontSize: 8, color: '#2a7a2a' }} title={t.desc}>
              + {t.label}
            </button>
          ))}

          {/* Newsletter always last — just edit it */}
          <p style={s.sideLabel}>ALWAYS LAST</p>
          <button onClick={() => setActive('newsletter')} style={{ ...s.sideBtn, background: active === 'newsletter' ? '#0a0a0a' : 'transparent', color: active === 'newsletter' ? '#f5f3ef' : '#0a0a0a' }}>
            ✉ Newsletter
          </button>
        </div>
      </aside>

      {/* ── EDITOR ── */}
      <div style={{ ...s.editor, ...(isMobile ? s.editorMobile : {}) }}>
        {/* Top bar */}
        <div style={{ ...s.topBar, ...(isMobile ? s.topBarMobile : {}) }}>
          <div>
            <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 26, letterSpacing: 2, lineHeight: 1 }}>HOMEPAGE EDITOR</h1>
            <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', marginTop: 2 }}>Changes go live when you save.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {saved && <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#2a7a2a' }}>✓ Saved</span>}
            {error && <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#e03030' }}>{error}</span>}
            <a href="/" target="_blank" rel="noreferrer" style={s.secBtn}>PREVIEW →</a>
            <button onClick={handleSave} disabled={saving} style={s.saveBtn}>
              {saving ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
          </div>
        </div>

        <div style={{ padding: isMobile ? '16px 12px 64px' : '24px 28px 80px' }}>

          {/* ── HERO ── */}
          {active === 'hero' && (
            <Card title="HERO SECTION" hint="Big title and image at the top. Always shown first.">
              <Field label="TAGLINE" value={cfg.heroSlides?.[0]?.tagline || cfg.heroTagline} onChange={e => setHeroSlide(0, 'tagline', e.target.value)} />
              <Field label="BIG TITLE" value={cfg.heroSlides?.[0]?.title || cfg.heroTitle} onChange={e => setHeroSlide(0, 'title', e.target.value)} />
              <TwoCol>
                <Field label="BUTTON LABEL" value={cfg.heroSlides?.[0]?.ctaLabel || cfg.heroCtaLabel} onChange={e => setHeroSlide(0, 'ctaLabel', e.target.value)} />
                <div>
                  <label style={s.label}>CATEGORY LINK</label>
                  <select value={cfg.heroSlides?.[0]?.category || 'hoodie'} onChange={e => setHeroSlide(0, 'category', e.target.value)} style={s.input}>
                    {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </TwoCol>
              <ImageField label="HERO IMAGE" value={cfg.heroSlides?.[0]?.imageUrl || ''} onChange={val => setHeroSlide(0, 'imageUrl', val)} onError={setError} />
              <Toggle label="Use dark CTA text on this hero image" checked={!!cfg.heroSlides?.[0]?.darkText} onChange={e => setHeroSlide(0, 'darkText', e.target.checked)} />
              {cfg.heroSlides.slice(1).map((slide, idx) => {
                const i = idx + 1;
                return (
                  <div key={i} style={{ border: '1px solid #d0cdc9', padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', letterSpacing: 1 }}>HERO {i + 1}</p>
                      <button onClick={() => set('heroSlides')(cfg.heroSlides.filter((_, slideIdx) => slideIdx !== i))} style={{ ...s.arrowBtn, color: '#e03030', borderColor: '#e03030' }} title="Remove">x</button>
                    </div>
                    <Field label="TAGLINE" value={slide.tagline} onChange={e => setHeroSlide(i, 'tagline', e.target.value)} />
                    <Field label="BIG TITLE" value={slide.title} onChange={e => setHeroSlide(i, 'title', e.target.value)} />
                    <TwoCol>
                      <Field label="BUTTON LABEL" value={slide.ctaLabel} onChange={e => setHeroSlide(i, 'ctaLabel', e.target.value)} />
                      <div>
                        <label style={s.label}>CATEGORY LINK</label>
                        <select value={slide.category || 'hoodie'} onChange={e => setHeroSlide(i, 'category', e.target.value)} style={s.input}>
                          {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </TwoCol>
                    <ImageField label="HERO IMAGE" value={slide.imageUrl || ''} onChange={val => setHeroSlide(i, 'imageUrl', val)} onError={setError} />
                    <Toggle label="Use dark CTA text on this hero image" checked={!!slide.darkText} onChange={e => setHeroSlide(i, 'darkText', e.target.checked)} />
                  </div>
                );
              })}
              <button
                onClick={addHeroSlide}
                style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 1, padding: '11px', border: '1px dashed #d0cdc9', background: 'transparent', cursor: 'pointer', width: '100%', color: '#888' }}
              >
                + ADD HERO
              </button>
              <Preview>
                <div style={{ background: '#ede9e3', padding: '24px 20px', textAlign: 'center' }}>
                  <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', marginBottom: 4 }}>{cfg.heroSlides?.[0]?.tagline}</p>
                  <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: 56, lineHeight: .9, marginBottom: 14 }}>{cfg.heroSlides?.[0]?.title}</h2>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, borderBottom: '1px solid #0a0a0a', paddingBottom: 2 }}>{cfg.heroSlides?.[0]?.ctaLabel} →</span>
                </div>
              </Preview>
            </Card>
          )}

          {/* ── FEATURED PRODUCTS ── */}
          {active === 'featured' && (
            <Card title="FEATURED PRODUCTS" hint="Always shown after the hero. To change which products appear here, go to Products → Edit a product → check 'Featured'.">
              <div style={{ padding: 16, background: '#ede9e3', fontFamily: 'Space Mono, monospace', fontSize: 10, lineHeight: 1.9 }}>
                ℹ This section renders automatically from products marked <strong>Featured</strong> in the product editor. No manual controls needed here.
              </div>
            </Card>
          )}

          {/* ── NEWSLETTER ── */}
          {active === 'newsletter' && (
            <Card title="NEWSLETTER" hint="Always shown last, above the footer.">
              <Field label="HEADING" value={cfg.newsletterHeading} onChange={e => set('newsletterHeading')(e.target.value)} />
              <Field label="SUBTEXT" value={cfg.newsletterSubtext} onChange={e => set('newsletterSubtext')(e.target.value)} />
              <Preview>
                <div style={{ background: '#0a0a0a', color: '#f5f3ef', padding: '32px 20px', textAlign: 'center' }}>
                  <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: 40, lineHeight: .9, marginBottom: 8 }}>{cfg.newsletterHeading}</h2>
                  <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888' }}>{cfg.newsletterSubtext}</p>
                </div>
              </Preview>
            </Card>
          )}

          {/* ── BUILT-IN MOVEABLE SECTIONS ── */}
          {active === 'ticker' && (
            <Card title="SCROLLING TICKER" hint="The black scrolling bar. You can move this anywhere in the page order or hide it.">
              <Toggle label="Show ticker" checked={cfg.tickerVisible} onChange={e => set('tickerVisible')(e.target.checked)} />
              <Field label="TICKER TEXT (repeats continuously)" value={cfg.tickerText} onChange={e => set('tickerText')(e.target.value)} />
              <Preview>
                <div style={{ background: '#0a0a0a', color: '#f5f3ef', padding: '10px 16px', fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 3, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {cfg.tickerText} ✦ {cfg.tickerText} ✦ {cfg.tickerText}
                </div>
              </Preview>
            </Card>
          )}

          {active === 'cards' && (
            <Card title="CATEGORY CARDS" hint="Horizontal scrolling carousel — visitors swipe/scroll through cards. Add, remove or reorder them here.">
              {cfg.featuredCards.map((card, i) => (
                <div key={i} style={{ border: '1px solid #d0cdc9', padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', letterSpacing: 1 }}>CARD {i + 1}</p>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => {
                        if (i === 0) return;
                        const cards = [...cfg.featuredCards];
                        [cards[i - 1], cards[i]] = [cards[i], cards[i - 1]];
                        set('featuredCards')(cards);
                      }} disabled={i === 0} style={s.arrowBtn} title="Move up">↑</button>
                      <button onClick={() => {
                        if (i === cfg.featuredCards.length - 1) return;
                        const cards = [...cfg.featuredCards];
                        [cards[i], cards[i + 1]] = [cards[i + 1], cards[i]];
                        set('featuredCards')(cards);
                      }} disabled={i === cfg.featuredCards.length - 1} style={s.arrowBtn} title="Move down">↓</button>
                      <button onClick={() => {
                        if (cfg.featuredCards.length <= 1) return;
                        if (!window.confirm('Remove this card?')) return;
                        set('featuredCards')(cfg.featuredCards.filter((_, idx) => idx !== i));
                      }} style={{ ...s.arrowBtn, color: '#e03030', borderColor: '#e03030' }} title="Remove">✕</button>
                    </div>
                  </div>
                  <TwoCol>
                    <Field label="TITLE" value={card.title} onChange={e => setCard(i, 'title', e.target.value)} />
                    <div>
                      <label style={s.label}>CATEGORY LINK</label>
                      <select value={card.category} onChange={e => setCard(i, 'category', e.target.value)} style={s.input}>
                        {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </TwoCol>

                  {/* Image or gradient */}
                  <div style={{ marginTop: 10 }}>
                    <label style={s.label}>BACKGROUND IMAGE (overrides gradient if set)</label>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      <input
                        value={card.imageUrl || ''}
                        onChange={e => setCard(i, 'imageUrl', e.target.value)}
                        style={{ ...s.input, flex: 1 }}
                        placeholder="Paste image URL..."
                      />
                      <label style={{ display: 'inline-flex', alignItems: 'center', padding: '0 12px', border: '1px solid #d0cdc9', cursor: 'pointer', fontFamily: 'Space Mono, monospace', fontSize: 9, whiteSpace: 'nowrap', background: '#ede9e3' }}>
                        📁 Upload
                        <input type="file" accept="image/*" style={{ display: 'none' }}
                          onChange={async e => {
                            const file = e.target.files[0];
                            if (!file) return;
                            const formData = new FormData();
                            formData.append('images', file);
                            try {
                              const res = await api.post('/admin/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                              setCard(i, 'imageUrl', res.data.urls[0]);
                            } catch (err) { setError('Image upload failed. Add Cloudinary keys to .env or paste a URL instead.'); }
                          }}
                        />
                      </label>
                    </div>
                    {card.imageUrl ? (
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img src={card.imageUrl} alt="" style={{ height: 80, objectFit: 'cover', border: '1px solid #d0cdc9' }} />
                        <button onClick={() => setCard(i, 'imageUrl', '')} style={{ position: 'absolute', top: 2, right: 2, background: '#e03030', color: '#fff', border: 'none', width: 18, height: 18, cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                      </div>
                    ) : (
                      <GradientField label="GRADIENT FALLBACK" value={card.bg} onChange={val => setCard(i, 'bg', val)} />
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                    {[{ label: 'Light text (dark bg)', val: false }, { label: 'Dark text (light bg)', val: true }].map(opt => (
                      <label key={String(opt.val)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Space Mono, monospace', fontSize: 9, cursor: 'pointer' }}>
                        <input type="radio" checked={card.dark === opt.val} onChange={() => setCard(i, 'dark', opt.val)} /> {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {/* Add card */}
              <button
                onClick={() => set('featuredCards')([...cfg.featuredCards, { title: 'NEW CARD', category: 'hoodie', bg: 'linear-gradient(160deg,#1a1a1a,#3d3d3d)', imageUrl: '', dark: false }])}
                style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 1, padding: '11px', border: '1px dashed #d0cdc9', background: 'transparent', cursor: 'pointer', width: '100%', color: '#888' }}
              >
                + ADD CARD
              </button>

              {/* Mini preview */}
              <Preview>
                <div style={{ display: 'flex', gap: 1, background: '#d0cdc9', overflowX: 'auto', padding: 1 }}>
                  {cfg.featuredCards.map((card, i) => (
                    <div key={i} style={{ flexShrink: 0, width: 120, height: 72, background: card.imageUrl ? 'transparent' : card.bg, position: 'relative', overflow: 'hidden' }}>
                      {card.imageUrl && <img src={card.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      <p style={{ position: 'absolute', top: 5, left: 7, fontFamily: 'Anton, sans-serif', fontSize: 9, color: (card.imageUrl || !card.dark) ? '#f5f3ef' : '#0a0a0a', lineHeight: 1.2 }}>{card.title}</p>
                    </div>
                  ))}
                </div>
              </Preview>
            </Card>
          )}

          {active === 'collection' && (
            <Card title="COLLECTION HEADING" hint="The large heading section with category tab links.">
              <Field label="HEADING" value={cfg.collectionTitle} onChange={e => set('collectionTitle')(e.target.value)} />
              <Field label="SUBTEXT" value={cfg.collectionSubtext} onChange={e => set('collectionSubtext')(e.target.value)} textarea />
              <Preview>
                <div style={{ textAlign: 'center', padding: '28px 20px' }}>
                  <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: 56, lineHeight: .9, marginBottom: 8 }}>{cfg.collectionTitle}</h2>
                  <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', maxWidth: 360, margin: '0 auto' }}>{cfg.collectionSubtext}</p>
                </div>
              </Preview>
            </Card>
          )}

          {active === 'banner' && (
            <Card title="SEASONAL BANNER" hint="The big two-panel section. Update this for each season or campaign.">
              <Field label="HEADING (e.g. FULL WINTERS, SUMMER LAUNCH)" value={cfg.banner?.heading || ''} onChange={e => set('banner.heading')(e.target.value)} />
              <Field label="SUBTEXT" value={cfg.banner?.subheading || ''} onChange={e => set('banner.subheading')(e.target.value)} textarea />
              <TwoCol>
                <Field label="CTA LABEL" value={cfg.banner?.ctaLabel || ''} onChange={e => set('banner.ctaLabel')(e.target.value)} />
                <Field label="CTA LINK"  value={cfg.banner?.ctaLink  || ''} onChange={e => set('banner.ctaLink')(e.target.value)} />
              </TwoCol>
              <TwoCol>
                <GradientField label="LEFT PANEL"  value={cfg.banner?.bgLeft  || ''} onChange={val => set('banner.bgLeft')(val)} />
                <GradientField label="RIGHT PANEL" value={cfg.banner?.bgRight || ''} onChange={val => set('banner.bgRight')(val)} />
              </TwoCol>
              <TwoCol>
                <ImageField label="LEFT PANEL IMAGE" value={cfg.banner?.imageUrlLeft || ''} onChange={val => set('banner.imageUrlLeft')(val)} onError={setError} />
                <ImageField label="RIGHT PANEL IMAGE" value={cfg.banner?.imageUrlRight || ''} onChange={val => set('banner.imageUrlRight')(val)} onError={setError} />
              </TwoCol>
              <Preview>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#d0cdc9', alignItems: 'stretch' }}>
                  <div style={{ minHeight: cfg.banner?.imageUrlLeft ? 0 : 90, background: cfg.banner?.imageUrlLeft ? '#ede9e3' : (cfg.banner?.bgLeft || '#111') }}>
                    {cfg.banner?.imageUrlLeft && <img src={cfg.banner.imageUrlLeft} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                  </div>
                  <div style={{ minHeight: cfg.banner?.imageUrlRight ? 0 : 90, background: cfg.banner?.imageUrlRight ? '#ede9e3' : (cfg.banner?.bgRight || '#c8b89a') }}>
                    {cfg.banner?.imageUrlRight && <img src={cfg.banner.imageUrlRight} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                  </div>
                </div>
                <div style={{ background: '#f5f3ef', padding: '10px 14px', border: '1px solid #d0cdc9' }}>
                  <p style={{ fontFamily: 'Anton, sans-serif', fontSize: 22 }}>{cfg.banner?.heading}</p>
                  <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', marginTop: 3 }}>{cfg.banner?.subheading}</p>
                </div>
              </Preview>
            </Card>
          )}

          {/* ── CUSTOM SECTIONS ── */}
          {customSections.map(sec => active === sec.id && (
            <CustomSectionEditor
              key={sec.id}
              sec={sec}
              onChange={(field, val) => updateCustomSection(sec.id, field, val)}
              onDelete={() => deleteCustomSection(sec.id)}
            />
          ))}

          {/* Announcement (accessible from hero section at bottom) */}
          {active === 'hero' && (
            <Card title="ANNOUNCEMENT BAR" hint="The black bar at the very top of every page (not part of the reorderable sections).">
              <Toggle label="Show announcement bar" checked={cfg.announcementVisible} onChange={e => set('announcementVisible')(e.target.checked)} />
              <Field label="TEXT" value={cfg.announcementText} onChange={e => set('announcementText')(e.target.value)} />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Custom section editor ────────────────────────────────
function CustomSectionEditor({ sec, onChange, onDelete }) {
  const typeLabel = CUSTOM_SECTION_TYPES.find(t => t.value === sec.type)?.label || sec.type;
  return (
    <Card
      title={`CUSTOM: ${typeLabel.toUpperCase()}`}
      hint={CUSTOM_SECTION_TYPES.find(t => t.value === sec.type)?.desc}
      action={<button style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, padding: '5px 10px', border: '1px solid #e03030', color: '#e03030', background: 'none', cursor: 'pointer' }} onClick={onDelete}>✕ DELETE</button>}
    >
      <Toggle label="Section visible" checked={sec.visible} onChange={e => onChange('visible', e.target.checked)} />
      {sec.type !== 'product_carousel' && (
        <Field label="HEADING" value={sec.heading} onChange={e => onChange('heading', e.target.value)} />
      )}

      {sec.type === 'product_carousel' && (
        <>
          <Field label="SECTION HEADING (e.g. SUMMER DROP, NEW ARRIVALS)" value={sec.heading} onChange={e => onChange('heading', e.target.value)} />
          <TwoCol>
            <Field label="SHOP ALL LABEL" value={sec.ctaLabel} onChange={e => onChange('ctaLabel', e.target.value)} />
            <Field label="SHOP ALL LINK (e.g. /shop/hoodie)" value={sec.ctaLink} onChange={e => onChange('ctaLink', e.target.value)} />
          </TwoCol>
          <div style={{ padding: '12px 14px', border: '1px solid #d0cdc9', background: '#faf9f7', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', letterSpacing: 1 }}>PRODUCTS TO SHOW — choose one method:</p>
            <div>
              <label style={s.label}>OPTION 1: BY CATEGORY (auto-loads all products in that category)</label>
              <select
                value={sec.carouselCategory}
                onChange={e => { onChange('carouselCategory', e.target.value); if (e.target.value) onChange('productIds', []); }}
                style={s.input}
              >
                <option value="">— None (use product slugs instead) —</option>
                {['hoodie','sweatshirt','outwear','athletic','shoes','accessories'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={s.label}>OPTION 2: SPECIFIC PRODUCT SLUGS (one per line, e.g. vintage-wash-oversized-hoodie)</label>
              <textarea
                value={(sec.productIds || []).join('\n')}
                onChange={e => { onChange('productIds', e.target.value.split('\n').map(s => s.trim()).filter(Boolean)); onChange('carouselCategory', ''); }}
                rows={4}
                style={{ ...s.input, resize: 'vertical', fontFamily: 'Space Mono, monospace', fontSize: 10 }}
                placeholder={'vintage-wash-oversized-hoodie\ngraphic-print-hoodie\nclassic-crewneck-sweatshirt'}
              />
              <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 8, color: '#888', marginTop: 4 }}>Find slugs in Products → Edit product → the URL field.</p>
            </div>
          </div>
        </>
      )}

      {sec.type === 'banner' && (
        <>
          <TwoCol>
            <GradientField label="LEFT PANEL"  value={sec.bgLeft}  onChange={val => onChange('bgLeft', val)} />
            <GradientField label="RIGHT PANEL" value={sec.bgRight} onChange={val => onChange('bgRight', val)} />
          </TwoCol>
          <Preview>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#d0cdc9' }}>
              <div style={{ minHeight: 70, background: sec.bgLeft }} />
              <div style={{ minHeight: 70, background: sec.bgRight }} />
            </div>
          </Preview>
        </>
      )}

      {sec.type === 'text' && (
        <>
          <Field label="BODY TEXT" value={sec.body} onChange={e => onChange('body', e.target.value)} textarea />
          <TwoCol>
            <Field label="CTA LABEL (optional)" value={sec.ctaLabel} onChange={e => onChange('ctaLabel', e.target.value)} />
            <Field label="CTA LINK"             value={sec.ctaLink}  onChange={e => onChange('ctaLink',  e.target.value)} />
          </TwoCol>
        </>
      )}

      {sec.type === 'image_text' && (
        <>
          <Field label="IMAGE URL" value={sec.imageUrl} onChange={e => onChange('imageUrl', e.target.value)} />
          <div>
            <label style={s.label}>IMAGE SIDE</label>
            <div style={{ display: 'flex', gap: 16 }}>
              {['left','right'].map(side => (
                <label key={side} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Space Mono, monospace', fontSize: 9, cursor: 'pointer' }}>
                  <input type="radio" checked={sec.imageSide === side} onChange={() => onChange('imageSide', side)} /> Image {side}
                </label>
              ))}
            </div>
          </div>
          <Field label="SUBTEXT" value={sec.subtext} onChange={e => onChange('subtext', e.target.value)} textarea />
          <TwoCol>
            <Field label="CTA LABEL" value={sec.ctaLabel} onChange={e => onChange('ctaLabel', e.target.value)} />
            <Field label="CTA LINK"  value={sec.ctaLink}  onChange={e => onChange('ctaLink',  e.target.value)} />
          </TwoCol>
          <Toggle label="Use dark text" checked={sec.darkText} onChange={e => onChange('darkText', e.target.checked)} />
        </>
      )}

      {sec.type === 'cta' && (
        <>
          <Field label="SUBTEXT" value={sec.subtext} onChange={e => onChange('subtext', e.target.value)} />
          <TwoCol>
            <Field label="BUTTON LABEL" value={sec.ctaLabel} onChange={e => onChange('ctaLabel', e.target.value)} />
            <Field label="BUTTON LINK"  value={sec.ctaLink}  onChange={e => onChange('ctaLink',  e.target.value)} />
          </TwoCol>
          <GradientField label="BACKGROUND" value={sec.bgLeft} onChange={val => onChange('bgLeft', val)} />
          <Toggle label="Use dark text (for light backgrounds)" checked={sec.darkText} onChange={e => onChange('darkText', e.target.checked)} />
          <Preview>
            <div style={{ background: sec.bgLeft, padding: '28px 16px', textAlign: 'center' }}>
              <h3 style={{ fontFamily: 'Anton, sans-serif', fontSize: 32, color: sec.darkText ? '#0a0a0a' : '#f5f3ef', marginBottom: 6 }}>{sec.heading}</h3>
              {sec.subtext && <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: sec.darkText ? '#444' : 'rgba(255,255,255,.7)', marginBottom: 12 }}>{sec.subtext}</p>}
              <span style={{ display: 'inline-block', fontFamily: 'Space Mono, monospace', fontSize: 9, padding: '8px 18px', background: sec.darkText ? '#0a0a0a' : '#f5f3ef', color: sec.darkText ? '#f5f3ef' : '#0a0a0a' }}>{sec.ctaLabel}</span>
            </div>
          </Preview>
        </>
      )}
    </Card>
  );
}

// ─── Shared sub-components ────────────────────────────────
function Card({ title, hint, children, action }) {
  return (
    <div style={{ border: '1px solid #d0cdc9', marginBottom: 16 }}>
      <div style={{ background: '#ede9e3', padding: '10px 18px', borderBottom: '1px solid #d0cdc9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, letterSpacing: 2 }}>{title}</h3>
          {hint && <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#888', marginTop: 2 }}>{hint}</p>}
        </div>
        {action}
      </div>
      <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, textarea }) {
  return (
    <div>
      <label style={s.label}>{label}</label>
      {textarea
        ? <textarea value={value} onChange={onChange} rows={3} style={{ ...s.input, resize: 'vertical' }} />
        : <input    value={value} onChange={onChange}          style={s.input} />}
    </div>
  );
}

function TwoCol({ children }) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  return <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>{children}</div>;
}

function Toggle({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontFamily: 'Space Mono, monospace', fontSize: 10 }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ accentColor: '#0a0a0a', width: 14, height: 14 }} />
      {label}
    </label>
  );
}

function GradientField({ label, value, onChange }) {
  return (
    <div>
      <label style={s.label}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={s.input}>
        {PRESET_GRADIENTS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
      </select>
      <input value={value} onChange={e => onChange(e.target.value)} style={{ ...s.input, marginTop: 6, fontSize: 9 }} placeholder="Or type custom CSS gradient..." />
      <div style={{ marginTop: 6, height: 22, background: value, border: '1px solid #d0cdc9' }} />
    </div>
  );
}

function ImageField({ label, value, onChange, onError }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  return (
    <div>
      <label style={s.label}>{label}</label>
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 8, marginBottom: 6 }}>
        <input
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          style={{ ...s.input, flex: 1 }}
          placeholder="Paste image URL..."
        />
        <label style={{ display: 'inline-flex', alignItems: 'center', padding: '0 12px', border: '1px solid #d0cdc9', cursor: 'pointer', fontFamily: 'Space Mono, monospace', fontSize: 9, whiteSpace: 'nowrap', background: '#ede9e3' }}>
          Upload
          <input type="file" accept="image/*" style={{ display: 'none' }}
            onChange={async e => {
              const file = e.target.files[0];
              if (!file) return;
              const formData = new FormData();
              formData.append('images', file);
              try {
                const res = await api.post('/admin/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                onChange(res.data.urls[0]);
              } catch (err) {
                onError?.('Image upload failed. Add Cloudinary keys to .env or paste a URL instead.');
              }
            }}
          />
        </label>
        <button type="button" onClick={() => setPickerOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', padding: '0 12px', border: '1px solid #d0cdc9', cursor: 'pointer', fontFamily: 'Space Mono, monospace', fontSize: 9, whiteSpace: 'nowrap', background: 'transparent' }}>
          Media
        </button>
      </div>
      {value && (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img src={value} alt="" style={{ height: 80, objectFit: 'cover', border: '1px solid #d0cdc9' }} />
          <button onClick={() => onChange('')} style={{ position: 'absolute', top: 2, right: 2, background: '#e03030', color: '#fff', border: 'none', width: 18, height: 18, cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>x</button>
        </div>
      )}
      {pickerOpen && <MediaPicker onSelect={onChange} onClose={() => setPickerOpen(false)} />}
    </div>
  );
}

function Preview({ children }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ border: '1px solid #d0cdc9' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '7px 12px', fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1, background: '#faf9f7', border: 'none', cursor: 'pointer' }}>
        LIVE PREVIEW <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div style={{ padding: 1 }}>{children}</div>}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────
const s = {
  shell:    { display: 'grid', gridTemplateColumns: '230px 1fr', minHeight: '100vh', background: '#f5f3ef' },
  shellMobile: { display: 'flex', flexDirection: 'column' },
  sidebar:  { borderRight: '1px solid #d0cdc9', position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column', overflowY: 'hidden' },
  sidebarMobile: { position: 'relative', top: 'auto', height: 'auto', maxHeight: '46vh', borderRight: 'none', borderBottom: '1px solid #d0cdc9' },
  sideLabel:{ fontFamily: 'Space Mono, monospace', fontSize: 8, color: '#aaa', letterSpacing: 2, padding: '10px 14px 3px', display: 'block' },
  sideBtn:  { display: 'block', width: '100%', padding: '8px 14px', fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: .5, border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all .15s', borderBottom: '1px solid #f0ede9' },
  arrowBtn: { background: 'none', border: 'none', width: 22, height: '50%', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, color: '#888' },
  editor:   { overflowY: 'auto' },
  editorMobile: { overflowY: 'visible' },
  topBar:   { position: 'sticky', top: 0, zIndex: 50, background: '#f5f3ef', borderBottom: '1px solid #d0cdc9', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  topBarMobile: { padding: '12px', alignItems: 'flex-start', flexDirection: 'column' },
  saveBtn:  { fontFamily: 'Space Mono, monospace', fontSize: 11, letterSpacing: 1, padding: '11px 22px', background: '#0a0a0a', color: '#f5f3ef', border: 'none', cursor: 'pointer' },
  secBtn:   { fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 1, padding: '10px 16px', background: 'transparent', color: '#0a0a0a', border: '1px solid #d0cdc9', textDecoration: 'none', cursor: 'pointer' },
  label:    { display: 'block', fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1.5, color: '#888', marginBottom: 6 },
  input:    { width: '100%', border: '1px solid #d0cdc9', padding: '10px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: 13, background: 'transparent', outline: 'none' },
};
