import { HeroSection } from './HeroSection';
import { WhyChooseSpotOn } from './WhyChooseSpotOn';
import { SpecialOffers } from './SpecialOffers';
import { FeaturedBranches } from './FeaturedBranches';
import { NewDishesSection } from './NewDishesSection';

export function HomePageFeature() {
  return (
    <main className="bg-[#f9fafb] min-h-screen">
      <HeroSection />
      <NewDishesSection />
      <WhyChooseSpotOn />
      <SpecialOffers />
      <FeaturedBranches />
    </main>
  );
}
