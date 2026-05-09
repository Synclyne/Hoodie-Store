import dynamic from 'next/dynamic';
import React from 'react';
import RouteShell from './RouteShell';
import Seo from './Seo';
import { PageSkeleton } from '../components/Skeleton';

export default function createNextPage(importer, seo, shell = {}) {
  const shouldServerRender =
    shell.ssr ?? !['private', 'admin'].includes(shell.access || 'public');

  const Screen = dynamic(importer, {
    ssr: shouldServerRender,
    loading: () => <PageSkeleton variant={shell.skeleton || 'default'} />,
  });

  return function NextRoutePage(props) {
    const pageSeo = typeof seo === 'function' ? seo(props) : seo;

    return (
      <>
        <Seo {...pageSeo} />
        <RouteShell access={shell.access} permission={shell.permission}>
          <Screen {...props} />
        </RouteShell>
      </>
    );
  };
}
