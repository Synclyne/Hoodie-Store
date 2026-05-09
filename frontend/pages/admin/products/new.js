import createNextPage from '../../../src/next/createNextPage';

export default createNextPage(() => import('../../../src/pages/admin/AdminProductEdit'), {
  title: 'New Product',
  path: '/admin/products/new',
  noIndex: true,
}, { access: 'admin', permission: 'products' });
