export interface TagSpec {
  model: string;
  size: string;
  resolution: { width: number; height: number };
  colors: string[]; // ['B', 'W', 'R']
}

export const HARDWARE_SPECS: Record<string, TagSpec> = {
  '44': { model: 'ET0750-44', size: '7.50"', resolution: { width: 800, height: 480 }, colors: ['B', 'W', 'R'] },
  '36': { model: 'ET0213-36', size: '2.13"', resolution: { width: 250, height: 122 }, colors: ['B', 'W', 'R'] },
  '30': { model: 'ET0154-30', size: '1.54"', resolution: { width: 152, height: 152 }, colors: ['B', 'W', 'R'] },
  '3A': { model: 'ET0266-3A', size: '2.66"', resolution: { width: 296, height: 152 }, colors: ['B', 'W', 'R'] },
  '3D': { model: 'ET0290-3D', size: '2.90"', resolution: { width: 296, height: 128 }, colors: ['B', 'W', 'R'] },
  '40': { model: 'ET0420-40', size: '4.20"', resolution: { width: 400, height: 300 }, colors: ['B', 'W', 'R'] },
  '58': { model: 'ET1250-58', size: '12.50"', resolution: { width: 1304, height: 984 }, colors: ['B', 'W', 'R'] },
  '4C': { model: 'ET0430-4C', size: '4.30"', resolution: { width: 522, height: 122 }, colors: ['B', 'W', 'R'] },
  '4F': { model: 'ET0580-4F', size: '5.80"', resolution: { width: 648, height: 480 }, colors: ['B', 'W', 'R'] }
};

export function getSpecFromId(tagId: string): TagSpec {
  // Most ETAG IDs use the last 2 digits of the model code as a prefix or identifier
  // Based on common patterns in ESL Gen3
  const identifier = tagId.substring(0, 2).toUpperCase();
  
  if (HARDWARE_SPECS[identifier]) return HARDWARE_SPECS[identifier];

  // Try to find by identifying characters within the ID if prefix fails
  for (const key in HARDWARE_SPECS) {
    if (tagId.includes(key)) return HARDWARE_SPECS[key];
  }

  return {
    model: 'GENERIC_ESL',
    size: '2.13"',
    resolution: { width: 250, height: 122 },
    colors: ['B', 'W']
  };
}
