import createNextPage from '../src/next/createNextPage';

export default createNextPage(() => import('../src/pages/LoginPage'), {
  title: 'Sign In',
  description: 'Sign in to your HOODIE account.',
  path: '/login',
  noIndex: true,
}, { access: 'guest' });
