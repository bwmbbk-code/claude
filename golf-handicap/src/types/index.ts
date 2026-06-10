export type TeeColor = 'Championship' | 'Black' | 'Blue' | 'White' | 'Gold' | 'Red';

export const TEE_COLORS: TeeColor[] = ['Championship', 'Black', 'Blue', 'White', 'Gold', 'Red'];

export interface Tee {
  color: TeeColor;
  rating: number;
  slope: number;
  par: number;
}

export interface Course {
  id: string;
  name: string;
  location: string;
  tees: Tee[];
}

export interface Round {
  id: string;
  date: string;
  courseId: string;
  teeColor: string;
  adjustedScore: number;
  differential: number;
}
