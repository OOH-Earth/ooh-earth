import { useState } from "react";
import Nav from "@/components/ooh/Nav";
import Hero from "@/components/ooh/Hero";
import Mandate from "@/components/ooh/Mandate";
import CampaignAtlas from "@/components/ooh/CampaignAtlas";
import CityGrid from "@/components/ooh/CityGrid";
import CityPulse from "@/components/ooh/CityPulse";
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
import ImpactLedger from "@/components/ooh/ImpactLedger";
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
        <Mandate />
        <CampaignAtlas />
        <CityGrid />
        <CityPulse />
        <MiniMapStack />
        <AirCommons />
        <CarbonCounter />
        <OffenderRegistry />
        <AdSpendDamage />
        <OperativeNetwork />
        <Leaderboard />
        <Manifesto />
        <OnChain />
        <KlimaWidget />
        <DonationMomentum />
        <ImpactLedger />
      </main>

      <SiteFooter onCommand={openCommand} />

      <CommandCenter open={commandOpen} onClose={() => setCommandOpen(false)} />
    </div>
  );
}