import createNextPage from '../src/next/createNextPage';

export default createNextPage(() => import('../src/pages/RegisterPage'), {
  title: 'Create Account',
  description: 'Create your HOODIE account for faster checkout and order tracking.',
  path: '/register',
  noIndex: true,
}, { access: 'guest' });
