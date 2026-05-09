import createNextPage from '../../../../src/next/createNextPage';

export default createNextPage(() => import('../../../../src/pages/admin/AdminProductEdit'), {
  title: 'Edit Product',
  path: '/admin/products/edit',
  noIndex: true,
}, { access: 'admin', permission: 'products' });
