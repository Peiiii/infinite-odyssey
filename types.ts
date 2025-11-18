export type ParticleType = 'bubbles' | 'dust' | 'embers' | 'snow' | 'rain' | 'space' | 'none';

export interface WorldConfig {
  worldTitle: string;
  visualStyle: string;
  particleEffect: ParticleType;
}

export interface HistoryItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  timestamp: number;
}

export enum ActionType {
  EXPLORE = 'EXPLORE',
  DEEP_DIVE = 'DEEP_DIVE', // Can be interpreted as "Look Closer" or "Enter" in other contexts
  INSPECT = 'INSPECT',
  SURFACE = 'SURFACE' // Can be "Leave" or "Back away"
}
