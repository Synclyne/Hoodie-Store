import createNextPage from '../src/next/createNextPage';

export default createNextPage(() => import('../src/pages/WishlistPage'), {
  title: 'Wishlist',
  description: 'Review your saved HOODIE products.',
  path: '/wishlist',
  noIndex: true,
}, { access: 'private', skeleton: 'shop' });
