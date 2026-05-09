import createNextPage from '../../src/next/createNextPage';

export default createNextPage(() => import('../../src/pages/admin/AdminShipping'), {
  title: 'Admin Shipping',
  path: '/admin/shipping',
  noIndex: true,
}, { access: 'admin', permission: 'shipping' });
