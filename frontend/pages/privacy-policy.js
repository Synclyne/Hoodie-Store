import Seo from '../src/next/Seo';
import RouteShell from '../src/next/RouteShell';
import PolicyPage from '../src/pages/PolicyPage';

export default function PrivacyPolicyRoute() {
  return (
    <>
      <Seo title="Privacy Policy" description="Read the HOODIE store privacy policy." path="/privacy-policy" />
      <RouteShell>
        <PolicyPage type="privacy" />
      </RouteShell>
    </>
  );
}
