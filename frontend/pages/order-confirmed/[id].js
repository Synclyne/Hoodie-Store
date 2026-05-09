import createNextPage from '../../src/next/createNextPage';

export default createNextPage(() => import('../../src/pages/OrderConfirmPage'), {
  title: 'Order Confirmed',
  description: 'Your HOODIE order confirmation.',
  path: '/order-confirmed',
  noIndex: true,
}, { access: 'private' });
