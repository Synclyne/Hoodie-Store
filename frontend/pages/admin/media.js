import createNextPage from '../../src/next/createNextPage';

export default createNextPage(() => import('../../src/pages/admin/AdminMedia'), {
  title: 'Admin Media',
  path: '/admin/media',
  noIndex: true,
}, { access: 'admin', permission: 'products' });
