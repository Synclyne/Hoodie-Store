import createNextPage from '../src/next/createNextPage';

export default createNextPage(() => import('../src/pages/ForgotPasswordPage'), {
  title: 'Forgot Password',
  description: 'Reset your HOODIE account password.',
  path: '/forgot-password',
  noIndex: true,
}, { access: 'guest' });
