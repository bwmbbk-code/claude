import { Course, Round } from '../types';

const COURSES_KEY = 'golf_courses_v3';
const ROUNDS_KEY  = 'golf_rounds_v2';

const DEFAULT_COURSES: Course[] = [
  {
    id: 'tumwater_valley',
    name: 'Tumwater Valley Golf Club',
    location: 'Tumwater, WA',
    tees: [
      { color: 'Blue',  rating: 70.7, slope: 118, par: 72 },
      { color: 'White', rating: 68.6, slope: 114, par: 72 },
    ],
  },
  {
    id: 'capitol_city',
    name: 'Capitol City Golf Club',
    location: 'Lacey, WA',
    tees: [
      { color: 'Black', rating: 71.6, slope: 128, par: 72 },
      { color: 'White', rating: 69.1, slope: 127, par: 72 },
    ],
  },
  {
    id: 'indian_summer',
    name: 'Indian Summer G&CC',
    location: 'Olympia, WA',
    tees: [
      { color: 'Black', rating: 75.1, slope: 142, par: 72 },
      { color: 'Blue',  rating: 73.1, slope: 139, par: 72 },
      { color: 'White', rating: 71.5, slope: 133, par: 72 },
    ],
  },
  {
    id: 'hawks_prairie_links',
    name: 'Hawks Prairie — Links',
    location: 'Lacey, WA',
    tees: [
      { color: 'Black', rating: 73.1, slope: 128, par: 72 },
      { color: 'Blue',  rating: 72.3, slope: 127, par: 72 },
      { color: 'White', rating: 70.3, slope: 124, par: 72 },
    ],
  },
  {
    id: 'hawks_prairie_woodlands',
    name: 'Hawks Prairie — Woodlands',
    location: 'Lacey, WA',
    tees: [
      { color: 'Championship', rating: 75.1, slope: 138, par: 72 },
      { color: 'Blue',         rating: 72.9, slope: 134, par: 72 },
      { color: 'White',        rating: 70.3, slope: 127, par: 72 },
    ],
  },
  {
    id: 'olympia_country',
    name: 'Olympia Country & Golf Club',
    location: 'Olympia, WA',
    tees: [
      { color: 'Blue', rating: 69.6, slope: 116, par: 71 },
    ],
  },
  {
    id: 'salish_cliffs',
    name: 'Salish Cliffs Golf Club',
    location: 'Shelton, WA',
    tees: [
      { color: 'Championship', rating: 75.2, slope: 140, par: 72 },
    ],
  },
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
