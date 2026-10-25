import PortalShell from '@/components/ooh/map/PortalShell';
import { UNSUPPORTED_LAYER_NOTE } from '@/components/ooh/map/layers/unsupportedLayers';

// The mushroom and flora layers used AI-generated hotspots with no verifiable source, so they
// are unavailable (see layers/unsupportedLayers.js). No counts or filters are shown for them.
export default function EcologyPortal() {
  return (
    <PortalShell
      title="Ecology"
      accent="#39FF14"
      activeLayers={[]}
      unavailableNote={UNSUPPORTED_LAYER_NOTE}
      renderCard={() => null}
      setQuery={() => {}}
    />
  );
}
