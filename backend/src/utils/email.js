const nodemailer = require('nodemailer');
const StoreSettings = require('../models/StoreSettings');

// Create transporter once
const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST || 'smtp.gmail.com',
  port:   Number(process.env.EMAIL_PORT) || 587,
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const FROM = process.env.EMAIL_FROM || 'HOODIE Store <no-reply@hoodie.store>';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

async function getBrand() {
  const settings = await StoreSettings.findOne().lean().catch(() => null);
  return {
    name: settings?.storeName || 'HOODIE',
    from: settings?.supportEmail ? `${settings.storeName || 'HOODIE'} <${settings.supportEmail}>` : FROM,
  };
}

// ─── Shared HTML wrapper ──────────────────────────────────
function htmlWrap(content, brandName = 'HOODIE') {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <style>
      body { margin:0; padding:0; background:#f5f3ef; font-family:'Helvetica Neue',Arial,sans-serif; }
      .container { max-width:560px; margin:32px auto; background:#fff; border:1px solid #d0cdc9; }
      .header { background:#0a0a0a; padding:24px 32px; text-align:center; }
      .header h1 { color:#f5f3ef; margin:0; font-size:28px; letter-spacing:6px; font-family:Arial Black,sans-serif; }
      .body { padding:32px; }
      .footer { background:#0a0a0a; padding:16px 32px; text-align:center; }
      .footer p { color:#888; font-size:11px; margin:0; font-family:monospace; letter-spacing:1px; }
      table { width:100%; border-collapse:collapse; margin:16px 0; }
      td { padding:8px 0; font-size:13px; border-bottom:1px solid #f0ede9; }
      .label { color:#888; font-size:11px; font-family:monospace; letter-spacing:1px; }
      .btn { display:inline-block; padding:14px 28px; background:#0a0a0a; color:#f5f3ef; text-decoration:none; font-family:monospace; font-size:11px; letter-spacing:2px; margin:16px 0; }
      .total { font-size:22px; font-weight:bold; font-family:monospace; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header"><h1>${brandName}</h1></div>
      <div class="body">${content}</div>
      <div class="footer"><p>© 2025 ${brandName} STORE · ALL RIGHTS RESERVED</p></div>
    </div>
  </body>
  </html>`;
}

// ─── Send order confirmation ──────────────────────────────
async function sendOrderConfirmation(order, userEmail, userName) {
  if (!process.env.EMAIL_USER) return; // Skip if email not configured
  const brand = await getBrand();

  const itemRows = order.items.map(item => `
    <tr>
      <td>${item.name} <span style="color:#888;font-size:11px">(${item.size}/${item.color})</span></td>
      <td style="text-align:right;font-family:monospace">×${item.quantity}</td>
      <td style="text-align:right;font-family:monospace">KSh ${(item.price * item.quantity).toLocaleString()}</td>
    </tr>
  `).join('');

  const content = `
    <h2 style="font-family:monospace;font-size:13px;letter-spacing:2px;color:#888">ORDER CONFIRMED</h2>
    <h3 style="font-size:22px;margin:4px 0 20px">Hi ${userName}, your order is in! 🎉</h3>
    <p class="label">ORDER NUMBER</p>
    <p style="font-family:monospace;font-size:16px;font-weight:bold;margin:4px 0 20px">#${order.orderNumber}</p>

    <p class="label">ITEMS</p>
    <table>
      <thead><tr>
        <td class="label">PRODUCT</td>
        <td class="label" style="text-align:right">QTY</td>
        <td class="label" style="text-align:right">PRICE</td>
      </tr></thead>
      <tbody>${itemRows}</tbody>
    </table>

    <table>
      <tr><td class="label">Subtotal</td><td style="text-align:right;font-family:monospace">KSh ${order.subtotal.toLocaleString()}</td></tr>
      <tr><td class="label">Shipping</td><td style="text-align:right;font-family:monospace">${order.shipping === 0 ? 'FREE' : 'KSh ' + order.shipping.toLocaleString()}</td></tr>
      <tr><td class="label">VAT (16%)</td><td style="text-align:right;font-family:monospace">KSh ${order.tax.toLocaleString()}</td></tr>
      <tr><td style="font-family:monospace;font-weight:bold;font-size:13px">TOTAL</td><td style="text-align:right" class="total">KSh ${order.total.toLocaleString()}</td></tr>
    </table>

    <p class="label" style="margin-top:24px">SHIPPING TO</p>
    <p style="font-size:13px;line-height:1.8;color:#444">
      ${order.shippingAddress.fullName}<br>
      ${order.shippingAddress.line1}${order.shippingAddress.line2 ? ', ' + order.shippingAddress.line2 : ''}<br>
      ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}<br>
      ${order.shippingAddress.country}
    </p>

    <a href="${CLIENT_URL}/order-confirmed/${order._id}" class="btn">VIEW ORDER →</a>

    <p style="font-size:12px;color:#888;margin-top:24px">
      We'll send you another email when your order ships. 
      Questions? Reply to this email.
    </p>
  `;

  await transporter.sendMail({
    from:    brand.from,
    to:      userEmail,
    subject: `Order Confirmed #${order.orderNumber} — ${brand.name} Store`,
    html:    htmlWrap(content, brand.name),
  });
}

// ─── Send shipping notification ───────────────────────────
async function sendWelcomeEmail(userEmail, userName) {
  if (!process.env.EMAIL_USER) return;
  const brand = await getBrand();

  const content = `
    <h2 style="font-family:monospace;font-size:13px;letter-spacing:2px;color:#888">WELCOME</h2>
    <h3 style="font-size:22px;margin:4px 0 16px">Hi ${userName}, your account is ready.</h3>
    <p style="font-size:13px;color:#444;line-height:1.7;margin-bottom:24px">
      Thanks for joining ${brand.name}. You can now save your details, track orders, and check out faster.
    </p>
    <a href="${CLIENT_URL}/account" class="btn">VIEW ACCOUNT</a>
  `;

  await transporter.sendMail({
    from: brand.from,
    to: userEmail,
    subject: `Welcome to ${brand.name} Store`,
    html: htmlWrap(content, brand.name),
  });
}

async function sendShippingNotification(order, userEmail, userName) {
  if (!process.env.EMAIL_USER) return;
  const brand = await getBrand();

  const content = `
    <h2 style="font-family:monospace;font-size:13px;letter-spacing:2px;color:#888">YOUR ORDER IS ON THE WAY</h2>
    <h3 style="font-size:22px;margin:4px 0 20px">Hi ${userName}, your order has shipped! 🚚</h3>
    <p class="label">ORDER</p>
    <p style="font-family:monospace;font-size:16px;font-weight:bold;margin:4px 0 20px">#${order.orderNumber}</p>

    ${order.trackingNumber ? `
      <p class="label">TRACKING</p>
      <p style="font-family:monospace;font-size:14px;margin:4px 0 20px">
        ${order.trackingCarrier ? order.trackingCarrier + ' — ' : ''}
        <strong>${order.trackingNumber}</strong>
      </p>
    ` : ''}

    <a href="${CLIENT_URL}/account/orders" class="btn">TRACK ORDER →</a>

    <p style="font-size:12px;color:#888;margin-top:24px">
      Standard delivery: 3–5 business days.
    </p>
  `;

  await transporter.sendMail({
    from:    brand.from,
    to:      userEmail,
    subject: `Your Order #${order.orderNumber} Has Shipped — ${brand.name} Store`,
    html:    htmlWrap(content, brand.name),
  });
}

// ─── Send password reset ──────────────────────────────────
async function sendPasswordReset(userEmail, userName, resetToken) {
  if (!process.env.EMAIL_USER) return;
  const brand = await getBrand();

  const resetUrl = `${CLIENT_URL}/reset-password?token=${resetToken}`;

  const content = `
    <h2 style="font-family:monospace;font-size:13px;letter-spacing:2px;color:#888">PASSWORD RESET</h2>
    <h3 style="font-size:22px;margin:4px 0 16px">Hi ${userName},</h3>
    <p style="font-size:13px;color:#444;line-height:1.7;margin-bottom:24px">
      We received a request to reset your password. Click the button below to choose a new one.
      This link expires in <strong>1 hour</strong>.
    </p>

    <a href="${resetUrl}" class="btn">RESET MY PASSWORD →</a>

    <p style="font-size:12px;color:#888;margin-top:24px">
      If you didn't request this, you can safely ignore this email — your password won't change.
    </p>
  `;

  await transporter.sendMail({
    from:    brand.from,
    to:      userEmail,
    subject: `Reset Your ${brand.name} Store Password`,
    html:    htmlWrap(content, brand.name),
  });
}

async function sendNewsletterConfirmation(userEmail) {
  if (!process.env.EMAIL_USER) return;
  const brand = await getBrand();

  const content = `
    <h2 style="font-family:monospace;font-size:13px;letter-spacing:2px;color:#888">NEWSLETTER CONFIRMED</h2>
    <h3 style="font-size:22px;margin:4px 0 16px">You're on the list.</h3>
    <p style="font-size:13px;color:#444;line-height:1.7;margin-bottom:24px">
      We will send new drops, restocks, and store updates to this email.
    </p>
    <a href="${CLIENT_URL}/shop" class="btn">SHOP NOW</a>
  `;

  await transporter.sendMail({
    from: brand.from,
    to: userEmail,
    subject: `${brand.name} Newsletter Confirmed`,
    html: htmlWrap(content, brand.name),
  });
}

module.exports = {
  sendOrderConfirmation,
  sendWelcomeEmail,
  sendShippingNotification,
  sendPasswordReset,
  sendNewsletterConfirmation,
};
