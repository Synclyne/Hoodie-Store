import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../utils/api';

const DEFAULT_SETTINGS = {
  storeName: 'HOODIE',
  logoUrl: '',
  supportEmail: '',
  whatsappNumber: '254700000000',
  currencyCode: 'KES',
  currencyLabel: 'KSh',
  freeShippingVisible: true,
  freeShippingText: 'FREE SHIPPING ON ORDERS OVER KSh 5,000',
  locationName: '',
  locationAddress: '',
  mapEmbedUrl: '',
  socialLinks: {
    instagram: 'https://www.instagram.com/',
    telegram: 'https://t.me/',
    facebook: 'https://www.facebook.com/',
    x: 'https://x.com/',
  },
  policyLinks: {
    privacy: '/privacy-policy',
    terms: '/terms-and-conditions',
    returns: '',
    shipping: '',
  },
};

const SettingsContext = createContext({ settings: DEFAULT_SETTINGS, loading: true });

const mergeSettings = (settings = {}) => ({
  ...DEFAULT_SETTINGS,
  ...settings,
  socialLinks: { ...DEFAULT_SETTINGS.socialLinks, ...(settings.socialLinks || {}) },
  policyLinks: { ...DEFAULT_SETTINGS.policyLinks, ...(settings.policyLinks || {}) },
});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/settings')
      .then((res) => setSettings(mergeSettings(res.data.settings)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
