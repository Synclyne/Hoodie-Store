import createNextPage from '../../src/next/createNextPage';

export default createNextPage(() => import('../../src/pages/admin/AdminDashboard'), {
  title: 'Admin Dashboard',
  description: 'HOODIE admin dashboard.',
  path: '/admin',
  noIndex: true,
}, { access: 'admin' });
