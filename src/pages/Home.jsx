import { useState, useEffect } from "react";
import Nav from "@/components/ooh/Nav";
import MetroSlider from "@/components/ooh/MetroSlider";
import Hero from "@/components/ooh/Hero";
import Reveal from "@/components/ooh/Reveal";
import SpotIdentifyTag from "@/components/ooh/SpotIdentifyTag";
import OffenseCategories from "@/components/ooh/OffenseCategories";
import FieldWorkflow from "@/components/ooh/FieldWorkflow";
import FieldIdGenerator from "@/components/ooh/FieldIdGenerator";
import Mandate from "@/components/ooh/Mandate";
import CampaignAtlas from "@/components/ooh/CampaignAtlas";
import CityGrid from "@/components/ooh/CityGrid";
import CityPulse from "@/components/ooh/CityPulse";
import NomadPulse from "@/components/ooh/NomadPulse";
import MiniMapStack from "@/components/ooh/MiniMapStack";
import AirCommons from "@/components/ooh/AirCommons";
import CarbonCounter from "@/components/ooh/CarbonCounter";
import OffenderRegistry from "@/components/ooh/OffenderRegistry";
import AdSpendDamage from "@/components/ooh/AdSpendDamage";
import GlobeSection from "@/components/ooh/GlobeSection";
import MetroKit from "@/components/ooh/MetroKit";
import OperativeNetwork from "@/components/ooh/OperativeNetwork";
import Leaderboard from "@/components/ooh/Leaderboard";
import GamificationWidget from "@/components/ooh/gamification/GamificationWidget";
import KlimaWidget from "@/components/ooh/KlimaWidget";
import DonationMomentum from "@/components/ooh/DonationMomentum";
import Manifesto from "@/components/ooh/Manifesto";
import OnChain from "@/components/ooh/OnChain";
import SkyIntel from "@/components/ooh/SkyIntel";
import ImpactLedger from "@/components/ooh/ImpactLedger";
import LiveActivityFeed from "@/components/ooh/LiveActivityFeed";
import SiteFooter from "@/components/ooh/SiteFooter";
import CommandCenter from "@/components/ooh/CommandCenter";
import HorizonProgress from "@/components/ooh/HorizonProgress";
import ViewfinderCursor from "@/components/ooh/ViewfinderCursor";
import { useWalkthrough } from "@/lib/walkthroughContext";

const HOME_TOUR = [
  { title: "OOH Earth", body: "An open-source, community-funded atlas of public-space advertising — and the resistance reclaiming it. This tour walks you through the front line." },
  { target: '[data-tour="globe"]', title: "Orbital Atlas", body: "The live globe of logged spots. Drag to rotate, click a marker to inspect. Scroll-zoom is off here to keep the page steady — use the + / − keys (click the globe first) or open the full field map for scroll zoom." },
  { target: '[data-tour="theme"]', title: "Field controls", body: "Toggle Solar Smoke light mode, haptics, sound and read-aloud. Everything stays calm and quiet by default — turn up what you need." },
  { title: "Join the resistance", body: "File a report, claim a lead, or fund the treasury. The Command Center (top-right) opens every channel and tool. Press the Tour button on any page to walk it.", cta: true },
];

export default function Home() {
  const [commandOpen, setCommandOpen] = useState(false);
  const openCommand = () => setCommandOpen(true);
  const { registerSteps } = useWalkthrough();
  useEffect(() => { registerSteps(HOME_TOUR); }, [registerSteps]);

  return (
    <div className="relative bg-void">
      <ViewfinderCursor />
      <HorizonProgress />
      <Nav onCommand={openCommand} />

      <main>
        <Hero onCommand={openCommand} />
        <MetroSlider />
        <GlobeSection />
        <Reveal><MetroKit /></Reveal>
        <Reveal><Mandate /></Reveal>
        <SpotIdentifyTag />
        <Reveal><CampaignAtlas /></Reveal>
        <OffenseCategories />
        <Reveal><CityGrid /></Reveal>
        <Reveal><CityPulse /></Reveal>
        <Reveal><NomadPulse /></Reveal>
        <Reveal><MiniMapStack /></Reveal>
        <Reveal><AirCommons /></Reveal>
        <Reveal><CarbonCounter /></Reveal>
        <Reveal><OffenderRegistry /></Reveal>
        <Reveal><AdSpendDamage /></Reveal>
        <Reveal><OperativeNetwork /></Reveal>
        <FieldWorkflow />
        <Reveal><FieldIdGenerator /></Reveal>
        <Reveal><Leaderboard /></Reveal>
        <Reveal><GamificationWidget /></Reveal>
        <Reveal><Manifesto /></Reveal>
        <Reveal><OnChain /></Reveal>
        <Reveal><SkyIntel /></Reveal>
        <Reveal><KlimaWidget /></Reveal>
        <Reveal><DonationMomentum /></Reveal>
        <Reveal><ImpactLedger /></Reveal>
      </main>

      <LiveActivityFeed />
      <SiteFooter onCommand={openCommand} />

      <CommandCenter open={commandOpen} onClose={() => setCommandOpen(false)} />
    </div>
  );
}