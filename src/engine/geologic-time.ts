/**
 * Geologic time scale labels and boundaries.
 * Simplified — major eons and eras only.
 */

export interface GeologicInterval {
  name: string;
  startMya: number;
  endMya: number;
  color: string;
}

export const GEOLOGIC_EONS: GeologicInterval[] = [
  { name: 'Hadean', startMya: 4500, endMya: 4000, color: '#8b5a2b' },
  { name: 'Archean', startMya: 4000, endMya: 2500, color: '#d4507a' },
  { name: 'Proterozoic', startMya: 2500, endMya: 541, color: '#c87137' },
  { name: 'Phanerozoic', startMya: 541, endMya: 0, color: '#4a90d9' },
];

export const GEOLOGIC_ERAS: GeologicInterval[] = [
  { name: 'Hadean', startMya: 4500, endMya: 4000, color: '#8b5a2b' },
  { name: 'Eoarchean', startMya: 4000, endMya: 3600, color: '#d4507a' },
  { name: 'Paleoarchean', startMya: 3600, endMya: 3200, color: '#cc4072' },
  { name: 'Mesoarchean', startMya: 3200, endMya: 2800, color: '#c43068' },
  { name: 'Neoarchean', startMya: 2800, endMya: 2500, color: '#bc2060' },
  { name: 'Paleoproterozoic', startMya: 2500, endMya: 1600, color: '#e07850' },
  { name: 'Mesoproterozoic', startMya: 1600, endMya: 1000, color: '#d09040' },
  { name: 'Neoproterozoic', startMya: 1000, endMya: 541, color: '#c0a030' },
  { name: 'Paleozoic', startMya: 541, endMya: 252, color: '#5a9e4a' },
  { name: 'Mesozoic', startMya: 252, endMya: 66, color: '#4a90d9' },
  { name: 'Cenozoic', startMya: 66, endMya: 0, color: '#e0c040' },
];

export function getGeologicLabel(timeMya: number): string {
  for (const era of GEOLOGIC_ERAS) {
    if (timeMya >= era.endMya && timeMya <= era.startMya) {
      return era.name;
    }
  }
  return 'Unknown';
}

export function formatTimeMya(timeMya: number): string {
  if (timeMya === 0) return 'Present';
  if (timeMya < 1) return `${(timeMya * 1e6).toFixed(0)} years ago`;
  if (timeMya < 1000) return `${timeMya.toFixed(0)} Ma`;
  return `${(timeMya / 1000).toFixed(2)} Ga`;
}
