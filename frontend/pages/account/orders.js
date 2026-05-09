import createNextPage from '../../src/next/createNextPage';

export default createNextPage(() => import('../../src/pages/OrdersPage'), {
  title: 'Orders',
  description: 'Track your HOODIE orders.',
  path: '/account/orders',
  noIndex: true,
}, { access: 'private' });
