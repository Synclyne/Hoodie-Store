import React from 'react';
import AppProviders from '../src/next/AppProviders';
import '../src/styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <AppProviders>
      <Component {...pageProps} />
    </AppProviders>
  );
}
