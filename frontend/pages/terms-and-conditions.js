import Seo from '../src/next/Seo';
import RouteShell from '../src/next/RouteShell';
import PolicyPage from '../src/pages/PolicyPage';

export default function TermsRoute() {
  return (
    <>
      <Seo title="Terms & Conditions" description="Read the HOODIE store terms and conditions." path="/terms-and-conditions" />
      <RouteShell>
        <PolicyPage type="terms" />
      </RouteShell>
    </>
  );
}
