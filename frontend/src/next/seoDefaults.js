export const SITE_NAME = 'HOODIE';
export const DEFAULT_DESCRIPTION =
  'Shop premium hoodies, sweatshirts, shoes, and streetwear essentials with secure checkout and fast delivery.';

export const absoluteUrl = (path = '/') => {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

export const imageUrl = (image) => {
  if (!image) return null;
  if (typeof image === 'string') return image;
  return image.url || null;
};

export const productDescription = (product) => {
  if (!product) return DEFAULT_DESCRIPTION;
  return (
    product.shortDescription ||
    product.description ||
    `Shop ${product.name} from ${SITE_NAME}. Premium fit, secure checkout, and fast delivery.`
  );
};
