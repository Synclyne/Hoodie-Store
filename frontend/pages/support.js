import Seo from '../src/next/Seo';
import RouteShell from '../src/next/RouteShell';
import SupportPage from '../src/pages/SupportPage';

export default function SupportRoute() {
  return (
    <>
      <Seo title="Support" description="Contact HOODIE support about orders, delivery, sizing, and store questions." path="/support" />
      <RouteShell>
        <SupportPage />
      </RouteShell>
    </>
  );
}
