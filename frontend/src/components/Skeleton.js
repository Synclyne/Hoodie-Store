import React from 'react';

export function SkeletonBlock({ style }) {
  return <div className="skeleton-block" style={style} />;
}

export function PageSkeleton({ variant = 'default' }) {
  if (variant === 'shop') {
    return (
      <div className="skeleton-page">
        <div className="skeleton-header">
          <SkeletonBlock style={{ width: 260, height: 62 }} />
          <SkeletonBlock style={{ width: 96, height: 14 }} />
        </div>
        <div className="skeleton-shop">
          <div className="skeleton-sidebar">
            {[0, 1, 2, 3].map((i) => (
              <SkeletonBlock key={i} style={{ height: i === 0 ? 16 : 34, width: i === 0 ? '45%' : '100%' }} />
            ))}
          </div>
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    );
  }

  if (variant === 'product') {
    return (
      <div className="skeleton-page">
        <div className="skeleton-product">
          <div>
            <SkeletonBlock style={{ width: '100%', aspectRatio: '4 / 5' }} />
            <div className="skeleton-thumb-row">
              {[0, 1, 2, 3].map((i) => (
                <SkeletonBlock key={i} style={{ width: 72, height: 72 }} />
              ))}
            </div>
          </div>
          <div className="skeleton-product-copy">
            <SkeletonBlock style={{ width: '28%', height: 12 }} />
            <SkeletonBlock style={{ width: '82%', height: 70 }} />
            <SkeletonBlock style={{ width: '36%', height: 18 }} />
            <SkeletonBlock style={{ width: '100%', height: 44 }} />
            <SkeletonBlock style={{ width: '100%', height: 44 }} />
            <SkeletonBlock style={{ width: '100%', height: 52 }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="skeleton-page">
      <div className="skeleton-header">
        <SkeletonBlock style={{ width: 220, height: 54 }} />
        <SkeletonBlock style={{ width: 120, height: 14 }} />
      </div>
      <div className="skeleton-panel">
        <SkeletonBlock style={{ width: '70%', height: 18 }} />
        <SkeletonBlock style={{ width: '100%', height: 42 }} />
        <SkeletonBlock style={{ width: '88%', height: 42 }} />
        <SkeletonBlock style={{ width: '42%', height: 42 }} />
      </div>
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <main className="home-skeleton">
      <div className="skeleton-announcement" />
      <section className="skeleton-hero">
        <SkeletonBlock style={{ width: 220, height: 12 }} />
        <SkeletonBlock style={{ width: 'min(70vw, 620px)', height: 132 }} />
        <SkeletonBlock style={{ width: 'min(72vw, 820px)', height: 460 }} />
      </section>
      <div className="skeleton-social-row">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonBlock key={i} style={{ width: 34, height: 34 }} />
        ))}
      </div>
      <ProductGridSkeleton count={4} />
      <div className="skeleton-section-title">
        <SkeletonBlock style={{ width: 'min(76vw, 760px)', height: 96 }} />
        <SkeletonBlock style={{ width: 'min(70vw, 420px)', height: 16 }} />
      </div>
      <div className="skeleton-banner">
        <SkeletonBlock style={{ height: 420 }} />
        <SkeletonBlock style={{ height: 420 }} />
        <SkeletonBlock style={{ gridColumn: '1 / -1', height: 118 }} />
      </div>
    </main>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div className="skeleton-card" key={i}>
          <SkeletonBlock style={{ width: '100%', aspectRatio: '3 / 4' }} />
          <SkeletonBlock style={{ width: '84%', height: 14 }} />
          <SkeletonBlock style={{ width: '48%', height: 12 }} />
        </div>
      ))}
    </div>
  );
}
