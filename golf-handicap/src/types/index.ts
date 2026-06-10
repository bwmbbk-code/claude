export interface Course {
  id: string;
  name: string;
  rating: number;
  slope: number;
  par: number;
}

export interface Round {
  id: string;
  date: string;
  courseId: string;
  adjustedScore: number;
  differential: number;
  usedInIndex?: boolean;
}
