import Seo from '../../src/next/Seo';
import RouteShell from '../../src/next/RouteShell';
import ShopPage from '../../src/pages/ShopPage';

const titleFor = (category) =>
  category ? `${String(category).charAt(0).toUpperCase()}${String(category).slice(1)} Collection` : 'Shop Streetwear';

export default function CategoryRoute({ category }) {
  const seo = {
    title: titleFor(category),
    description: `Shop ${category || 'streetwear'} pieces from HOODIE with secure checkout and fast delivery.`,
    path: `/shop/${category || ''}`,
  };

  return (
    <>
      <Seo {...seo} />
      <RouteShell>
        <ShopPage />
      </RouteShell>
    </>
  );
}

export function getServerSideProps({ params }) {
  return { props: { category: params?.category || null } };
}
