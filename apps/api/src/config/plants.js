// Plant list inspired by common PlantVillage crop classes.
export const PLANT_CATALOG = [
  { key: 'tomato', label: 'Tomato', available: true },
  { key: 'potato', label: 'Potato', available: false },
  { key: 'pepper_bell', label: 'Pepper (Bell)', available: false },
  { key: 'maize', label: 'Maize (Corn)', available: false },
  { key: 'grape', label: 'Grape', available: false },
  { key: 'apple', label: 'Apple', available: false },
  { key: 'peach', label: 'Peach', available: false },
  { key: 'strawberry', label: 'Strawberry', available: false },
];

export const DEFAULT_PLANT_KEY = 'tomato';

export const AVAILABLE_PLANT_KEYS = new Set(
  PLANT_CATALOG.filter((plant) => plant.available).map((plant) => plant.key)
);

export function sanitizePreferredPlant(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return DEFAULT_PLANT_KEY;
  return AVAILABLE_PLANT_KEYS.has(normalized) ? normalized : DEFAULT_PLANT_KEY;
}

export default {
  PLANT_CATALOG,
  DEFAULT_PLANT_KEY,
  AVAILABLE_PLANT_KEYS,
  sanitizePreferredPlant,
};
