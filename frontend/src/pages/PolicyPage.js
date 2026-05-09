import React from 'react';
import { Link } from '../next/ReactRouterCompat';
import { useSettings } from '../context/SettingsContext';

const UPDATED = 'May 10, 2026';

const CONTENT = {
  privacy: {
    eyebrow: 'PRIVACY POLICY',
    title: 'Privacy Policy',
    intro: 'This policy explains how we collect, use, and protect customer information when you browse, create an account, place an order, or contact the store.',
    sections: [
      ['Information we collect', 'We collect the details needed to run the store, including your name, email address, phone number, delivery address, order details, account information, and messages you send to support.'],
      ['How we use information', 'We use this information to process orders, arrange delivery, provide customer support, send order updates, prevent fraud, improve the storefront, and comply with legal obligations.'],
      ['Payments', 'Payments may be processed by third-party payment providers. We do not store full card numbers or mobile-money credentials on the storefront.'],
      ['Sharing information', 'We only share information with service providers needed to operate the store, such as payment, delivery, hosting, analytics, and communication providers.'],
      ['Data security', 'We use reasonable technical and organizational measures to protect customer data. No online service can be guaranteed to be completely secure.'],
      ['Your choices', 'You can update account details, request support, unsubscribe from marketing where available, or ask us about personal information linked to your account.'],
      ['Contact', 'For privacy questions, contact the store using the support details shown on the site.'],
    ],
  },
  terms: {
    eyebrow: 'TERMS & CONDITIONS',
    title: 'Terms & Conditions',
    intro: 'These terms apply when you use the storefront, create an account, buy products, or contact us about an order.',
    sections: [
      ['Orders', 'Orders are subject to product availability, successful payment or approved cash-on-delivery handling, and accurate delivery information.'],
      ['Product details', 'We try to keep product photos, prices, sizes, colors, and stock accurate. Minor differences in color, fit, packaging, or display may occur.'],
      ['Pricing and payment', 'Prices are listed in Kenyan shillings unless stated otherwise. The final total may include delivery fees based on the delivery zone selected at checkout.'],
      ['Delivery', 'Delivery timing and pricing depend on the selected delivery zone, order details, and courier availability. You must choose the correct delivery zone before checkout.'],
      ['Returns and exchanges', 'Returns or exchanges may be accepted according to the store policy shown on the site or agreed by support for the specific order. Items may need to be unused and in original condition.'],
      ['Accounts', 'You are responsible for keeping your account login details secure and for activity under your account.'],
      ['Cancellations', 'We may cancel or refuse orders affected by suspected fraud, incorrect pricing, unavailable stock, or incomplete customer information.'],
      ['Limitation of liability', 'To the fullest extent allowed by law, the store is not liable for indirect losses arising from use of the storefront or delays outside our reasonable control.'],
      ['Updates', 'We may update these terms from time to time. The latest version posted on the site applies to future use and orders.'],
    ],
  },
};

export default function PolicyPage({ type }) {
  const { settings } = useSettings();
  const page = CONTENT[type] || CONTENT.terms;

  return (
    <main style={{ background: '#f5f3ef', minHeight: '80vh' }}>
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '48px 20px 72px' }}>
        <Link to="/" style={s.back}>BACK TO STORE</Link>
        <p style={s.eyebrow}>{page.eyebrow}</p>
        <h1 style={s.title}>{page.title}</h1>
        <p style={s.updated}>Last updated: {UPDATED}</p>
        <p style={s.intro}>{page.intro}</p>

        <div style={s.content}>
          {page.sections.map(([heading, body]) => (
            <section key={heading} style={s.section}>
              <h2 style={s.h2}>{heading}</h2>
              <p style={s.body}>{body}</p>
            </section>
          ))}
        </div>

        <div style={s.contact}>
          <p style={s.body}>
            Store: {settings.storeName || 'HOODIE'}
            {settings.supportEmail ? ` | Support: ${settings.supportEmail}` : ''}
          </p>
          <Link to="/support" style={s.supportLink}>CONTACT SUPPORT</Link>
        </div>
      </section>
    </main>
  );
}

const s = {
  back: { display: 'inline-block', fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1.5, color: '#888', textDecoration: 'none', borderBottom: '1px solid #d0cdc9', marginBottom: 28 },
  eyebrow: { fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 3, color: '#888', marginBottom: 10 },
  title: { fontFamily: 'Anton, sans-serif', fontSize: 'clamp(48px, 10vw, 104px)', lineHeight: .9, marginBottom: 12 },
  updated: { fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#888', marginBottom: 24 },
  intro: { fontSize: 17, lineHeight: 1.8, maxWidth: 720, color: '#333', marginBottom: 34 },
  content: { display: 'grid', gap: 18 },
  section: { borderTop: '1px solid #d0cdc9', paddingTop: 18 },
  h2: { fontFamily: 'Space Mono, monospace', fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 },
  body: { fontSize: 14, lineHeight: 1.8, color: '#444' },
  contact: { borderTop: '1px solid #d0cdc9', marginTop: 30, paddingTop: 18 },
  supportLink: { display: 'inline-block', marginTop: 12, fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: 1.5, border: '1px solid #0a0a0a', padding: '10px 14px', color: '#0a0a0a', textDecoration: 'none' },
};
