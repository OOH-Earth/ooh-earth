import { useEffect, lazy, Suspense } from 'react';
import Nav from '@/components/ooh/Nav';
import MetroSlider from '@/components/ooh/MetroSlider';
import Hero from '@/components/ooh/Hero';
import Reveal from '@/components/ooh/Reveal';
import GlobeSection from '@/components/ooh/GlobeSection';
import SiteFooter from '@/components/ooh/SiteFooter';
import HorizonProgress from '@/components/ooh/HorizonProgress';
import ViewfinderCursor from '@/components/ooh/ViewfinderCursor';
import { useWalkthrough } from '@/lib/walkthroughContext';

// Everything below is below-the-fold on first paint (rendered after Hero/
// MetroSlider/GlobeSection, the only above-the-fold sections). Lazy-loaded
// so every visitor's first load doesn't pay for ~25 widget sections'
// transitive bundle cost before Home can even paint -- Home was the one
// page in the app not already code-split (every other route already uses
// React.lazy, see KNOWN_ISSUES.md #15). `Reveal`'s whileInView animation
// only ever affected opacity/position, never deferred loading -- this adds
// real code-splitting on top of it, not a duplicate of what it already did.
const MetroKit = lazy(() => import('@/components/ooh/MetroKit'));
const Mandate = lazy(() => import('@/components/ooh/Mandate'));
const SpotIdentifyTag = lazy(() => import('@/components/ooh/SpotIdentifyTag'));
const CampaignAtlas = lazy(() => import('@/components/ooh/CampaignAtlas'));
const OffenseCategories = lazy(() => import('@/components/ooh/OffenseCategories'));
const CityGrid = lazy(() => import('@/components/ooh/CityGrid'));
const CityPulse = lazy(() => import('@/components/ooh/CityPulse'));
const NomadPulse = lazy(() => import('@/components/ooh/NomadPulse'));
const MiniMapStack = lazy(() => import('@/components/ooh/MiniMapStack'));
const AirCommons = lazy(() => import('@/components/ooh/AirCommons'));
const CarbonCounter = lazy(() => import('@/components/ooh/CarbonCounter'));
const OffenderRegistry = lazy(() => import('@/components/ooh/OffenderRegistry'));
const AdSpendDamage = lazy(() => import('@/components/ooh/AdSpendDamage'));
const OperativeNetwork = lazy(() => import('@/components/ooh/OperativeNetwork'));
const FieldWorkflow = lazy(() => import('@/components/ooh/FieldWorkflow'));
const FieldIdGenerator = lazy(() => import('@/components/ooh/FieldIdGenerator'));
const Leaderboard = lazy(() => import('@/components/ooh/Leaderboard'));
const GamificationWidget = lazy(() => import('@/components/ooh/gamification/GamificationWidget'));
const Manifesto = lazy(() => import('@/components/ooh/Manifesto'));
const OnChain = lazy(() => import('@/components/ooh/OnChain'));
const SkyIntel = lazy(() => import('@/components/ooh/SkyIntel'));
const KlimaWidget = lazy(() => import('@/components/ooh/KlimaWidget'));
const DonationMomentum = lazy(() => import('@/components/ooh/DonationMomentum'));
const ImpactLedger = lazy(() => import('@/components/ooh/ImpactLedger'));
const LiveActivityFeed = lazy(() => import('@/components/ooh/LiveActivityFeed'));

const HOME_TOUR = [
  {
    title: 'OOH Earth',
    body: 'An open-source, community-funded atlas of public-space advertising — and the resistance reclaiming it. This tour walks you through the front line.',
  },
  {
    target: '[data-tour="globe"]',
    title: 'Orbital Atlas',
    body: 'The live globe of logged spots. Drag to rotate, click a marker to inspect. Scroll-zoom is off here to keep the page steady — use the + / − keys (click the globe first) or open the full field map for scroll zoom.',
  },
  {
    target: '[data-tour="theme"]',
    title: 'Field controls',
    body: 'Toggle Solar Smoke light mode, haptics, sound and read-aloud. Everything stays calm and quiet by default — turn up what you need.',
  },
  {
    title: 'Join the resistance',
    body: 'File a report, claim a lead, or fund the treasury. The Command Center (top-right) opens every channel and tool. Press the Tour button on any page to walk it.',
    cta: true,
  },
];

export default function Home() {
  const { registerSteps } = useWalkthrough();
  useEffect(() => {
    registerSteps(HOME_TOUR);
  }, [registerSteps]);

  return (
    <div className="relative bg-void">
      <ViewfinderCursor />
      <HorizonProgress />
      <Nav />

      <main>
        <Hero />
        <MetroSlider />
        <GlobeSection />
        <Suspense fallback={null}>
          <Reveal>
            <MetroKit />
          </Reveal>
          <Reveal>
            <Mandate />
          </Reveal>
          <SpotIdentifyTag />
          <Reveal>
            <CampaignAtlas />
          </Reveal>
          <OffenseCategories />
          <Reveal>
            <CityGrid />
          </Reveal>
          <Reveal>
            <CityPulse />
          </Reveal>
          <Reveal>
            <NomadPulse />
          </Reveal>
          <Reveal>
            <MiniMapStack />
          </Reveal>
          <Reveal>
            <AirCommons />
          </Reveal>
          <Reveal>
            <CarbonCounter />
          </Reveal>
          <Reveal>
            <OffenderRegistry />
          </Reveal>
          <Reveal>
            <AdSpendDamage />
          </Reveal>
          <Reveal>
            <OperativeNetwork />
          </Reveal>
          <FieldWorkflow />
          <Reveal>
            <FieldIdGenerator />
          </Reveal>
          <Reveal>
            <Leaderboard />
          </Reveal>
          <Reveal>
            <GamificationWidget />
          </Reveal>
          <Reveal>
            <Manifesto />
          </Reveal>
          <Reveal>
            <OnChain />
          </Reveal>
          <Reveal>
            <SkyIntel />
          </Reveal>
          <Reveal>
            <KlimaWidget />
          </Reveal>
          <Reveal>
            <DonationMomentum />
          </Reveal>
          <Reveal>
            <ImpactLedger />
          </Reveal>
        </Suspense>
      </main>

      <Suspense fallback={null}>
        <LiveActivityFeed />
      </Suspense>
      <SiteFooter />
    </div>
  );
}
