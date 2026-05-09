import createNextPage from '../../src/next/createNextPage';

export default createNextPage(() => import('../../src/pages/AccountPage'), {
  title: 'Account',
  description: 'Manage your HOODIE account, addresses, and profile.',
  path: '/account',
  noIndex: true,
}, { access: 'private', skeleton: 'default' });
