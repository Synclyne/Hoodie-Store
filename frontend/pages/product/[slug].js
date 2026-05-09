import { DEFAULT_DESCRIPTION, absoluteUrl, imageUrl, productDescription } from '../../src/next/seoDefaults';
import Seo from '../../src/next/Seo';
import RouteShell from '../../src/next/RouteShell';
import ProductPage from '../../src/pages/ProductPage';

export default function ProductRoute({ product, initialProduct, slug }) {
  const seo = {
    title: product?.name || 'Product',
    description: product ? productDescription(product) : DEFAULT_DESCRIPTION,
    path: `/product/${product?.slug || slug || ''}`,
    image: imageUrl(product?.images?.[0]),
    type: 'product',
    jsonLd: product
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          description: productDescription(product),
          image: (product.images || []).map(imageUrl).filter(Boolean),
          sku: product.slug,
          brand: {
            '@type': 'Brand',
            name: 'HOODIE',
          },
          offers: {
            '@type': 'Offer',
            priceCurrency: 'KES',
            price: product.price,
            availability: product.totalStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            url: absoluteUrl(`/product/${product.slug}`),
          },
          aggregateRating: product.numReviews > 0
            ? {
                '@type': 'AggregateRating',
                ratingValue: product.rating,
                reviewCount: product.numReviews,
              }
            : undefined,
        }
      : undefined,
  };

  return (
    <>
      <Seo {...seo} />
      <RouteShell>
        <ProductPage initialProduct={initialProduct} />
      </RouteShell>
    </>
  );
}

export async function getServerSideProps({ params }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL;
  const slug = params?.slug || null;

  if (!apiUrl || !slug) return { props: { product: null, slug } };

  try {
    const res = await fetch(`${apiUrl.replace(/\/$/, '')}/products/${encodeURIComponent(slug)}`);
    if (!res.ok) return { props: { product: null, slug } };
    const data = await res.json();
    return { props: { product: data.product || null, initialProduct: data.product || null, slug } };
  } catch {
    return { props: { product: null, slug } };
  }
}
