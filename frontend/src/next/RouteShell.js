import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import CartDrawer from '../components/CartDrawer';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import api from '../utils/api';
import { PageSkeleton } from '../components/Skeleton';

function Loading() {
  return <PageSkeleton />;
}

function Guard({ children, access, permission }) {
  const router = useRouter();
  const { user, loading, hasPermission } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (access === 'guest' && user) router.replace('/account');
    if (access === 'private' && !user) router.replace('/login');
    if (access === 'admin') {
      if (!user) router.replace('/login');
      else if (user.role !== 'admin') router.replace('/');
      else if (permission && !hasPermission(permission)) router.replace('/admin');
    }
  }, [access, hasPermission, loading, permission, router, user]);

  if (!access || access === 'public') return children;
  if (loading) return <Loading />;
  if (access === 'guest' && user) return <Loading />;
  if (access === 'private' && !user) return <Loading />;
  if (access === 'admin') {
    if (!user || user.role !== 'admin') return <Loading />;
    if (permission && !hasPermission(permission)) return <Loading />;
  }

  return children;
}

function WhatsAppButton() {
  const { settings } = useSettings();

  return (
    <a
      href={`https://wa.me/${settings.whatsappNumber || '254700000000'}?text=${encodeURIComponent('Hi! I have a question about an order.')}`}
      target="_blank"
      rel="noreferrer"
      style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 999, width: 52, height: 52, borderRadius: '50%', background: '#25d366', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(37,211,102,.45)', textDecoration: 'none' }}
      title="Chat on WhatsApp"
      aria-label="Chat on WhatsApp"
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    </a>
  );
}

export default function RouteShell({ children, access = 'public', permission }) {
  const [siteBackground, setSiteBackground] = useState({
    color: '#f5f3ef',
    image: '',
  });

  useEffect(() => {
    if (access === 'admin') return undefined;

    let alive = true;
    api
      .get('/homepage')
      .then((res) => {
        if (!alive) return;
        setSiteBackground({
          color: res.data.config?.siteBackgroundColor || '#f5f3ef',
          image: res.data.config?.siteBackgroundImage || '',
        });
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, [access]);

  const shellBackground = {
    minHeight: '100vh',
    backgroundColor: siteBackground.color,
    ...(siteBackground.image
      ? {
          backgroundImage: `url("${siteBackground.image}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
        }
      : {}),
  };

  return (
    <>
      <Navbar />
      <CartDrawer />
      <div style={access === 'admin' ? undefined : shellBackground}>
        <Guard access={access} permission={permission}>
          {children}
        </Guard>
      </div>
      <WhatsAppButton />
    </>
  );
}
