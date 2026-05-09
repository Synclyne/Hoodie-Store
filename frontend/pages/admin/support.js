import createNextPage from '../../src/next/createNextPage';

export default createNextPage(() => import('../../src/pages/admin/AdminSupport'), {
  title: 'Support Inbox',
  description: 'Manage customer support messages.',
  path: '/admin/support',
  noIndex: true,
}, { access: 'admin', permission: 'support' });
