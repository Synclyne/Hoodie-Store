import createNextPage from '../../../src/next/createNextPage';

export default createNextPage(() => import('../../../src/pages/admin/AdminProducts'), {
  title: 'Admin Products',
  path: '/admin/products',
  noIndex: true,
}, { access: 'admin', permission: 'products' });
