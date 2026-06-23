import { ProfileFeature } from '@/features/profile/ProfileFeature';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';

export const metadata = {
  title: 'Profile | SpotOn',
  description: 'Manage your SpotOn profile',
};

export default function ProfilePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow pt-24 pb-12">
        <ProfileFeature />
      </main>
      <Footer />
    </div>
  );
}
