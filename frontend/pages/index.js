import { absoluteUrl } from '../src/next/seoDefaults';
import Seo from '../src/next/Seo';
import RouteShell from '../src/next/RouteShell';
import HomePage from '../src/pages/HomePage';

const homeSeo = {
  title: 'HOODIE',
  description: 'Shop premium streetwear hoodies, sweatshirts, outwear, and shoes in Kenya with secure checkout and fast delivery.',
  path: '/',
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    name: 'HOODIE Store',
    description: 'Premium streetwear hoodies, sweatshirts, outwear, and shoes.',
    url: absoluteUrl('/'),
    telephone: '+254700000000',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Nairobi',
      addressCountry: 'KE',
    },
    paymentAccepted: 'M-Pesa, Visa, Mastercard, Cash on Delivery',
    currenciesAccepted: 'KES',
    areaServed: ['Kenya', 'Uganda', 'Tanzania', 'Rwanda'],
  },
};

export default function HomeRoute({ homepageConfig, featuredProducts }) {
  return (
    <>
      <Seo {...homeSeo} />
      <RouteShell>
        <HomePage initialConfig={homepageConfig} initialFeatured={featuredProducts} />
      </RouteShell>
    </>
  );
}

export async function getServerSideProps() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL;
  if (!apiUrl) {
    return { props: { homepageConfig: null, featuredProducts: [] } };
  }

  const base = apiUrl.replace(/\/$/, '');

  try {
    const [homepageRes, featuredRes] = await Promise.allSettled([
      fetch(`${base}/homepage`),
      fetch(`${base}/products/featured`),
    ]);

    const homepageData = homepageRes.status === 'fulfilled' && homepageRes.value.ok
      ? await homepageRes.value.json()
      : null;
    const featuredData = featuredRes.status === 'fulfilled' && featuredRes.value.ok
      ? await featuredRes.value.json()
      : null;

    return {
      props: {
        homepageConfig: homepageData?.config || null,
        featuredProducts: featuredData?.products || [],
      },
    };
  } catch {
    return { props: { homepageConfig: null, featuredProducts: [] } };
  }
}
