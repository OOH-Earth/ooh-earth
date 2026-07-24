import { useState } from "react";
import Nav from "@/components/ooh/Nav";
import Hero from "@/components/ooh/Hero";
import Mandate from "@/components/ooh/Mandate";
import CampaignAtlas from "@/components/ooh/CampaignAtlas";
import CityGrid from "@/components/ooh/CityGrid";
import AirCommons from "@/components/ooh/AirCommons";
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
        <Mandate />
        <CampaignAtlas />
        <CityGrid />
        <AirCommons />
        <Manifesto />
        <OnChain />
        <ImpactLedger />
      </main>

      <SiteFooter onCommand={openCommand} />

      <CommandCenter open={commandOpen} onClose={() => setCommandOpen(false)} />
    </div>
  );
}