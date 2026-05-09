import Seo from '../../src/next/Seo';
import RouteShell from '../../src/next/RouteShell';
import ShopPage from '../../src/pages/ShopPage';

const seo = {
  title: 'Shop Streetwear',
  description: 'Browse hoodies, sweatshirts, shoes, and everyday streetwear essentials from HOODIE.',
  path: '/shop',
};

export default function ShopRoute() {
  return (
    <>
      <Seo {...seo} />
      <RouteShell>
        <ShopPage />
      </RouteShell>
    </>
  );
}
