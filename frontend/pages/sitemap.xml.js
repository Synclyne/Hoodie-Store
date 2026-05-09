const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL;

const staticRoutes = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/shop', priority: '0.9', changefreq: 'daily' },
  { path: '/shop/hoodie', priority: '0.8', changefreq: 'weekly' },
  { path: '/shop/sweatshirt', priority: '0.8', changefreq: 'weekly' },
  { path: '/shop/outwear', priority: '0.8', changefreq: 'weekly' },
  { path: '/shop/athletic', priority: '0.8', changefreq: 'weekly' },
  { path: '/shop/shoes', priority: '0.8', changefreq: 'weekly' },
];

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const urlEntry = ({ path, lastmod, priority, changefreq }) => `  <url>
    <loc>${escapeXml(`${SITE_URL}${path}`)}</loc>
    ${lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : ''}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

async function loadProductRoutes() {
  if (!API_URL) return [];

  try {
    const res = await fetch(`${API_URL.replace(/\/$/, '')}/products/seo/sitemap`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.products || []).map((product) => ({
      path: `/product/${product.slug}`,
      lastmod: product.updatedAt ? new Date(product.updatedAt).toISOString() : undefined,
      priority: '0.7',
      changefreq: 'weekly',
    }));
  } catch {
    return [];
  }
}

function SitemapXml() {
  return null;
}

export async function getServerSideProps({ res }) {
  const productRoutes = await loadProductRoutes();
  const routes = [...staticRoutes, ...productRoutes];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(urlEntry).join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.write(xml);
  res.end();

  return { props: {} };
}

export default SitemapXml;
