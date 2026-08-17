import { Turf, FilterState } from '../types';

export interface DemoTurfSeed extends Turf {
  latitude: number;
  longitude: number;
  createdAt: string;
}

export const DEMO_OWNERS: any[] = [];

export const DEMO_TURFS: DemoTurfSeed[] = [];

export const DEMO_REVIEWS: any[] = [];

export function filterDemoTurfs(filters: Partial<FilterState>): Turf[] {
  return [];
}
