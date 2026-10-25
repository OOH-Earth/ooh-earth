import PortalShell from '@/components/ooh/map/PortalShell';
import { UNSUPPORTED_LAYER_NOTE } from '@/components/ooh/map/layers/unsupportedLayers';

// The conflict-zone layer used AI-generated zones, coordinates and "sources" with no verified
// provenance, so it is unavailable (see layers/unsupportedLayers.js). No counts are shown.
export default function WarZonesPortal() {
  return (
    <PortalShell
      title="War Zones · Conflict"
      accent="#FF0040"
      activeLayers={[]}
      unavailableNote={UNSUPPORTED_LAYER_NOTE}
      renderCard={() => null}
      setQuery={() => {}}
    />
  );
}
