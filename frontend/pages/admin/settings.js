import createNextPage from '../../src/next/createNextPage';

export default createNextPage(() => import('../../src/pages/admin/AdminSettings'), {
  title: 'Admin Settings',
  path: '/admin/settings',
  noIndex: true,
}, { access: 'admin', permission: 'settings' });
