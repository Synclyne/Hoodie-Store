import createNextPage from '../src/next/createNextPage';

export default createNextPage(() => import('../src/pages/ResetPasswordPage'), {
  title: 'Reset Password',
  description: 'Set a new password for your HOODIE account.',
  path: '/reset-password',
  noIndex: true,
});
