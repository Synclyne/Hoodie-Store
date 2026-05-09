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

export default function HomeRoute() {
  return (
    <>
      <Seo {...homeSeo} />
      <RouteShell>
        <HomePage />
      </RouteShell>
    </>
  );
}
