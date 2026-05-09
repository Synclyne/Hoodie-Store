const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

function RobotsTxt() {
  return null;
}

export async function getServerSideProps({ res }) {
  res.setHeader('Content-Type', 'text/plain');
  res.write(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /account
Disallow: /cart
Disallow: /checkout
Disallow: /login
Disallow: /register
Disallow: /wishlist

Sitemap: ${siteUrl}/sitemap.xml
`);
  res.end();

  return { props: {} };
}

export default RobotsTxt;
