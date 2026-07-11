import { HeroSection } from './HeroSection';
import { WhyChooseSpotOn } from './WhyChooseSpotOn';
import { SpecialOffers } from './SpecialOffers';
import { FeaturedBranches } from './FeaturedBranches';
import { NewDishesSection } from './NewDishesSection';

export function HomePageFeature() {
  return (
    <main className="bg-[#164626] min-h-screen text-white">
      <HeroSection />
      <NewDishesSection />
      <WhyChooseSpotOn />
      <SpecialOffers />
      <FeaturedBranches />
    </main>
  );
}
