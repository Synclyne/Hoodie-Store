import createNextPage from '../../src/next/createNextPage';

export default createNextPage(() => import('../../src/pages/admin/AdminCoupons'), {
  title: 'Admin Coupons',
  path: '/admin/coupons',
  noIndex: true,
}, { access: 'admin', permission: 'coupons' });
