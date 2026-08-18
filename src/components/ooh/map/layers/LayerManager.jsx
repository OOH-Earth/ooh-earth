import RiverLayer from './RiverLayer';
import MushroomLayer from './MushroomLayer';
import FloraLayer from './FloraLayer';
import WarZoneLayer from './WarZoneLayer';
import RadioLayer from './RadioLayer';
import HeatLayer from './HeatLayer';

// Layer registry — renders the appropriate overlay components based on which
// layer IDs are active. Must be a child of react-leaflet's <MapContainer>.
const REGISTRY = {
  rivers: RiverLayer,
  mushrooms: MushroomLayer,
  flora: FloraLayer,
  war: WarZoneLayer,
  radio: RadioLayer,
  heat: HeatLayer,
};

// Layers that need the current marker set rather than static decoration.
const NEEDS_PINS = new Set(['heat']);

export default function LayerManager({ activeLayers, pins = [], onExpandPin }) {
  return (
    <>
      {activeLayers.map((id) => {
        const Layer = REGISTRY[id];
        if (!Layer) return null;
        return NEEDS_PINS.has(id) ? (
          <Layer key={id} pins={pins} onExpandPin={onExpandPin} />
        ) : (
          <Layer key={id} />
        );
      })}
    </>
  );
}
