import { Course, Round } from '../types';

const COURSES_KEY = 'golf_courses_v2';
const ROUNDS_KEY = 'golf_rounds_v1';

// Olympia, WA area courses — ratings from USGA/WA Golf databases
const DEFAULT_COURSES: Course[] = [
  // Tumwater Valley Golf Club — Tumwater, WA (public, 18H)
  { id: 'tv_blue',  name: 'Tumwater Valley — Blue',  rating: 70.7, slope: 118, par: 72 },
  { id: 'tv_white', name: 'Tumwater Valley — White', rating: 68.6, slope: 114, par: 72 },

  // Capitol City Golf Club — Lacey, WA (public, 18H)
  { id: 'cc_black', name: 'Capitol City — Black', rating: 71.6, slope: 128, par: 72 },
  { id: 'cc_white', name: 'Capitol City — White', rating: 69.1, slope: 127, par: 72 },

  // Indian Summer Golf & Country Club — Olympia, WA (private, 18H)
  { id: 'is_black', name: 'Indian Summer — Black', rating: 75.1, slope: 142, par: 72 },
  { id: 'is_blue',  name: 'Indian Summer — Blue',  rating: 73.1, slope: 139, par: 72 },
  { id: 'is_white', name: 'Indian Summer — White', rating: 71.5, slope: 133, par: 72 },

  // Hawks Prairie — The Links — Lacey, WA (public, 18H)
  { id: 'hp_links_black', name: 'Hawks Prairie Links — Black', rating: 73.1, slope: 128, par: 72 },
  { id: 'hp_links_blue',  name: 'Hawks Prairie Links — Blue',  rating: 72.3, slope: 127, par: 72 },
  { id: 'hp_links_white', name: 'Hawks Prairie Links — White', rating: 70.3, slope: 124, par: 72 },

  // Hawks Prairie — The Woodlands — Lacey, WA (public, 18H)
  { id: 'hp_woods_champ', name: 'Hawks Prairie Woodlands — Championship', rating: 75.1, slope: 138, par: 72 },
  { id: 'hp_woods_blue',  name: 'Hawks Prairie Woodlands — Blue',         rating: 72.9, slope: 134, par: 72 },
  { id: 'hp_woods_white', name: 'Hawks Prairie Woodlands — White',        rating: 70.3, slope: 127, par: 72 },

  // Olympia Country & Golf Club — Olympia, WA (private, 18H)
  { id: 'oc_blue', name: 'Olympia Country & Golf Club', rating: 69.6, slope: 116, par: 71 },

  // Salish Cliffs Golf Club — Shelton, WA (~20 min from Olympia, public, 18H)
  { id: 'sc_champ', name: 'Salish Cliffs — Championship', rating: 75.2, slope: 140, par: 72 },
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
