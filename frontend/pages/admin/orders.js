import createNextPage from '../../src/next/createNextPage';

export default createNextPage(() => import('../../src/pages/admin/AdminOrders'), {
  title: 'Admin Orders',
  path: '/admin/orders',
  noIndex: true,
}, { access: 'admin', permission: 'orders' });
