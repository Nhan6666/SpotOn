import { HeroSection } from './HeroSection';
import { WhyChooseSpotOn } from './WhyChooseSpotOn';
import { SpecialOffers } from './SpecialOffers';
import { FeaturedBranches } from './FeaturedBranches';

export function HomePageFeature() {
  return (
    <main className="bg-[#f9fafb] min-h-screen">
      <HeroSection />
      <WhyChooseSpotOn />
      <SpecialOffers />
      <FeaturedBranches />
    </main>
  );
}
