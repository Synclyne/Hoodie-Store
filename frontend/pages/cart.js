import createNextPage from '../src/next/createNextPage';

export default createNextPage(() => import('../src/pages/CartPage'), {
  title: 'Cart',
  description: 'Review your HOODIE shopping cart.',
  path: '/cart',
  noIndex: true,
}, { access: 'private', skeleton: 'default' });
