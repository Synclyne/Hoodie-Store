import createNextPage from '../../src/next/createNextPage';

export default createNextPage(() => import('../../src/pages/admin/AdminHomepage'), {
  title: 'Admin Homepage',
  path: '/admin/homepage',
  noIndex: true,
}, { access: 'admin', permission: 'homepage' });
