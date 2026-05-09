import createNextPage from '../src/next/createNextPage';

export default createNextPage(() => import('../src/pages/CheckoutPage'), {
  title: 'Checkout',
  description: 'Secure checkout for your HOODIE order.',
  path: '/checkout',
  noIndex: true,
}, { access: 'private', skeleton: 'default' });
