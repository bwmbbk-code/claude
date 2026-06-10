import { Course, Round } from '../types';

const COURSES_KEY = 'golf_courses_v1';
const ROUNDS_KEY = 'golf_rounds_v1';

const DEFAULT_COURSES: Course[] = [
  { id: 'c1', name: '서울CC',       rating: 73.5, slope: 135, par: 72 },
  { id: 'c2', name: '남서울CC',     rating: 71.2, slope: 128, par: 71 },
  { id: 'c3', name: '한양CC',       rating: 70.8, slope: 122, par: 72 },
  { id: 'c4', name: '안양CC',       rating: 72.1, slope: 130, par: 72 },
  { id: 'c5', name: 'Pebble Beach', rating: 75.5, slope: 145, par: 72 },
];

export const storage = {
  getCourses(): Course[] {
    try {
      const raw = localStorage.getItem(COURSES_KEY);
      return raw ? (JSON.parse(raw) as Course[]) : DEFAULT_COURSES;
    } catch {
      return DEFAULT_COURSES;
    }
  },

  saveCourses(courses: Course[]): void {
    localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
  },

  getRounds(): Round[] {
    try {
      const raw = localStorage.getItem(ROUNDS_KEY);
      return raw ? (JSON.parse(raw) as Round[]) : [];
    } catch {
      return [];
    }
  },

  saveRounds(rounds: Round[]): void {
    localStorage.setItem(ROUNDS_KEY, JSON.stringify(rounds));
  },

  clear(): void {
    localStorage.removeItem(COURSES_KEY);
    localStorage.removeItem(ROUNDS_KEY);
  },
};
