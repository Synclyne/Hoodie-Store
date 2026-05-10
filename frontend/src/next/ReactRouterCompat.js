import NextLink from 'next/link';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useMemo } from 'react';

export function Link({ to, href, replace, children, ...props }) {
  return (
    <NextLink href={href || to || '/'} replace={replace} legacyBehavior passHref>
      <a {...props}>{children}</a>
    </NextLink>
  );
}

export function useNavigate() {
  const router = useRouter();

  return useCallback((to, options = {}) => {
    if (typeof to === 'number') {
      if (to === -1) router.back();
      return;
    }

    if (options.replace) return router.replace(to);
    return router.push(to);
  }, [router]);
}

export function useParams() {
  const { query } = useRouter();
  return query;
}

export function useLocation() {
  const router = useRouter();
  const [pathname = '/', search = ''] = router.asPath.split('?');

  return {
    pathname,
    search: search ? `?${search}` : '',
    hash: '',
    state: null,
  };
}

export function useSearchParams() {
  const router = useRouter();
  const search = router.asPath.includes('?') ? router.asPath.split('?').slice(1).join('?') : '';
  const params = useMemo(() => new URLSearchParams(search), [search]);

  const setParams = (nextParams, options = {}) => {
    const value =
      nextParams instanceof URLSearchParams
        ? nextParams.toString()
        : new URLSearchParams(nextParams).toString();
    const href = value ? `${router.pathname}?${value}` : router.pathname;
    return options.replace ? router.replace(href) : router.push(href);
  };

  return [params, setParams];
}

export function Navigate({ to, replace = false }) {
  const router = useRouter();

  useEffect(() => {
    if (replace) router.replace(to);
    else router.push(to);
  }, [replace, router, to]);

  return null;
}

export function BrowserRouter({ children }) {
  return <>{children}</>;
}

export function Routes({ children }) {
  return <>{children}</>;
}

export function Route() {
  return null;
}
