import createNextPage from '../../src/next/createNextPage';

export default createNextPage(() => import('../../src/pages/admin/AdminReviews'), {
  title: 'Admin Reviews',
  path: '/admin/reviews',
  noIndex: true,
}, { access: 'admin', permission: 'products' });
