import { useState } from "react";
import Nav from "@/components/ooh/Nav";
import Hero from "@/components/ooh/Hero";
import CampaignAtlas from "@/components/ooh/CampaignAtlas";
import Manifesto from "@/components/ooh/Manifesto";
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
        <CampaignAtlas />
        <Manifesto />
        <ImpactLedger />
      </main>

      <SiteFooter onCommand={openCommand} />

      <CommandCenter open={commandOpen} onClose={() => setCommandOpen(false)} />
    </div>
  );
}