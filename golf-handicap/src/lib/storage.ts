import { Course, Round } from '../types';

const COURSES_KEY = 'golf_courses_v4';
const ROUNDS_KEY  = 'golf_rounds_v2';

// Olympia, WA 기준 50마일 이내 골프장 (CR/SR: USGA/WA Golf 데이터베이스 기준)
const DEFAULT_COURSES: Course[] = [

  // ── OLYMPIA / LACEY / TUMWATER (5마일 이내) ──────────────────────────
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

  // ── SHELTON (~20마일 서쪽) ────────────────────────────────────────────
  {
    id: 'salish_cliffs',
    name: 'Salish Cliffs Golf Club',
    location: 'Shelton, WA',
    tees: [
      { color: 'Championship', rating: 75.2, slope: 140, par: 72 },
    ],
  },

  // ── JBLM / FORT LEWIS (~20마일 북쪽) — 군 골프장, 27홀 3조합 ───────────
  {
    id: 'eagles_pride_rb',
    name: 'Eagles Pride — Red/Blue',
    location: 'JBLM, Fort Lewis, WA',
    tees: [
      { color: 'Blue',  rating: 73.1, slope: 126, par: 72 },
      { color: 'White', rating: 70.5, slope: 118, par: 72 },
    ],
  },
  {
    id: 'eagles_pride_rg',
    name: 'Eagles Pride — Red/Green',
    location: 'JBLM, Fort Lewis, WA',
    tees: [
      { color: 'Blue',  rating: 71.4, slope: 123, par: 72 },
      { color: 'White', rating: 69.9, slope: 118, par: 72 },
    ],
  },
  {
    id: 'eagles_pride_bg',
    name: 'Eagles Pride — Blue/Green',
    location: 'JBLM, Fort Lewis, WA',
    tees: [
      { color: 'Blue',  rating: 71.5, slope: 125, par: 71 },
      { color: 'White', rating: 70.0, slope: 120, par: 71 },
    ],
  },

  // ── DUPONT (~20마일 북쪽) ─────────────────────────────────────────────
  {
    id: 'home_course',
    name: 'The Home Course',
    location: 'DuPont, WA',
    tees: [
      { color: 'Championship', rating: 74.8, slope: 138, par: 72 },
      { color: 'Black',        rating: 73.0, slope: 135, par: 72 },
      { color: 'Blue',         rating: 71.0, slope: 131, par: 72 },
      { color: 'White',        rating: 68.7, slope: 125, par: 72 },
    ],
  },

  // ── SPANAWAY (~28마일 북쪽) ───────────────────────────────────────────
  {
    id: 'classic_gc',
    name: 'Classic Golf Club',
    location: 'Spanaway, WA',
    tees: [
      { color: 'Black', rating: 71.4, slope: 128, par: 72 },
      { color: 'Blue',  rating: 69.6, slope: 127, par: 72 },
      { color: 'White', rating: 67.8, slope: 122, par: 72 },
    ],
  },

  // ── TACOMA (~30마일 북쪽) ─────────────────────────────────────────────
  {
    id: 'lake_spanaway',
    name: 'Lake Spanaway Golf Course',
    location: 'Tacoma, WA',
    tees: [
      { color: 'Black', rating: 73.7, slope: 132, par: 72 },
      { color: 'Blue',  rating: 71.6, slope: 124, par: 72 },
      { color: 'White', rating: 70.0, slope: 121, par: 72 },
    ],
  },
  {
    id: 'tacoma_cgc',
    name: 'Tacoma Country & Golf Club',
    location: 'Lakewood, WA',
    tees: [
      { color: 'Black', rating: 73.8, slope: 135, par: 72 },
      { color: 'Blue',  rating: 70.8, slope: 130, par: 72 },
      { color: 'White', rating: 68.2, slope: 124, par: 72 },
    ],
  },
  {
    id: 'meadow_park',
    name: 'Meadow Park Golf Course',
    location: 'Tacoma, WA',
    tees: [
      { color: 'Black', rating: 69.6, slope: 117, par: 71 },
      { color: 'Blue',  rating: 67.7, slope: 115, par: 71 },
      { color: 'White', rating: 64.7, slope: 105, par: 71 },
    ],
  },
  {
    id: 'allenmore',
    name: 'Allenmore Golf Course',
    location: 'Tacoma, WA',
    tees: [
      { color: 'Blue', rating: 68.3, slope: 118, par: 71 },
    ],
  },
  {
    id: 'brookdale',
    name: 'Brookdale Golf Club',
    location: 'Tacoma, WA',
    tees: [
      { color: 'Blue',  rating: 70.4, slope: 115, par: 71 },
      { color: 'White', rating: 69.1, slope: 113, par: 71 },
    ],
  },

  // ── UNIVERSITY PLACE (~35마일 북쪽) — 2015 US Open 개최지 ─────────────
  {
    id: 'chambers_bay',
    name: 'Chambers Bay',
    location: 'University Place, WA',
    tees: [
      { color: 'Championship', rating: 77.6, slope: 145, par: 72 },
      { color: 'Black',        rating: 74.4, slope: 138, par: 72 },
      { color: 'Blue',         rating: 72.4, slope: 134, par: 72 },
      { color: 'White',        rating: 70.6, slope: 130, par: 72 },
    ],
  },

  // ── CHEHALIS (~35마일 남쪽) ───────────────────────────────────────────
  {
    id: 'riverside_chehalis',
    name: 'Riverside Golf Club',
    location: 'Chehalis, WA',
    tees: [
      { color: 'Blue',  rating: 68.8, slope: 127, par: 71 },
      { color: 'White', rating: 67.6, slope: 124, par: 71 },
    ],
  },

  // ── BREMERTON (~45마일 북서쪽) ────────────────────────────────────────
  {
    id: 'gold_mountain_olympic',
    name: 'Gold Mountain — Olympic',
    location: 'Bremerton, WA',
    tees: [
      { color: 'Championship', rating: 74.9, slope: 148, par: 72 },
      { color: 'Blue',         rating: 72.6, slope: 142, par: 72 },
      { color: 'White',        rating: 70.2, slope: 134, par: 72 },
    ],
  },
  {
    id: 'gold_mountain_cascade',
    name: 'Gold Mountain — Cascade',
    location: 'Bremerton, WA',
    tees: [
      { color: 'Championship', rating: 73.4, slope: 134, par: 71 },
      { color: 'Blue',         rating: 71.6, slope: 129, par: 71 },
      { color: 'White',        rating: 70.1, slope: 124, par: 71 },
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
