import { useState } from "react";
import Nav from "@/components/ooh/Nav";
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
import NewsTicker from "@/components/ooh/NewsTicker";
import OperativeNetwork from "@/components/ooh/OperativeNetwork";
import Leaderboard from "@/components/ooh/Leaderboard";
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

export default function Home() {
  const [commandOpen, setCommandOpen] = useState(false);
  const openCommand = () => setCommandOpen(true);

  return (
    <div className="relative bg-void">
      <ViewfinderCursor />
      <HorizonProgress />
      <Nav onCommand={openCommand} />

      <main>
        <Hero onCommand={openCommand} />
        <NewsTicker />
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