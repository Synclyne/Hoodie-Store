import createNextPage from '../../src/next/createNextPage';

export default createNextPage(() => import('../../src/pages/admin/AdminStaff'), {
  title: 'Admin Staff',
  path: '/admin/staff',
  noIndex: true,
}, { access: 'admin', permission: 'staff' });
