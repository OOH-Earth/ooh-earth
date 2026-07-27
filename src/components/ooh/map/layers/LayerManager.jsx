import RiverLayer from "./RiverLayer";
import MushroomLayer from "./MushroomLayer";
import FloraLayer from "./FloraLayer";
import WarZoneLayer from "./WarZoneLayer";

// Layer registry — renders the appropriate overlay components based on which
// layer IDs are active. Must be a child of react-leaflet's <MapContainer>.
const REGISTRY = {
  rivers: RiverLayer,
  mushrooms: MushroomLayer,
  flora: FloraLayer,
  war: WarZoneLayer,
};

export default function LayerManager({ activeLayers }) {
  return (
    <>
      {activeLayers.map((id) => {
        const Layer = REGISTRY[id];
        return Layer ? <Layer key={id} /> : null;
      })}
    </>
  );
}