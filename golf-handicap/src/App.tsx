import { useState, useEffect } from 'react';
import { Course, Round } from './types';
import { storage } from './lib/storage';
import { calcDifferential } from './lib/handicap';
import Dashboard from './components/Dashboard';
import ScoreEntry from './components/ScoreEntry';
import RoundHistory from './components/RoundHistory';
import CourseManager from './components/CourseManager';

type Tab = 'dashboard' | 'entry' | 'history' | 'courses';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'dashboard', label: '대시보드', icon: '📊' },
  { id: 'entry',     label: '라운드 입력', icon: '✏️' },
  { id: 'history',   label: '기록',     icon: '📋' },
  { id: 'courses',   label: '코스 관리', icon: '🗺️' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [courses, setCourses] = useState<Course[]>(() => storage.getCourses());
  const [rounds, setRounds] = useState<Round[]>(() => storage.getRounds());

  useEffect(() => { storage.saveCourses(courses); }, [courses]);
  useEffect(() => { storage.saveRounds(rounds); }, [rounds]);

  function addRound(round: Round) {
    const course = courses.find(c => c.id === round.courseId);
    const tee = course?.tees.find(t => t.color === round.teeColor);
    if (!course || !tee) return;
    const r: Round = {
      ...round,
      differential: calcDifferential(round.adjustedScore, tee.rating, tee.slope),
    };
    setRounds(prev => [...prev, r]);
    setTab('dashboard');
  }

  function deleteRound(id: string) {
    setRounds(prev => prev.filter(r => r.id !== id));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-900 text-white shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <span className="text-2xl">⛳</span>
          <div>
            <h1 className="text-lg font-bold leading-tight">골프 핸디캡 계산기</h1>
            <p className="text-green-300 text-xs">World Handicap System (WHS)</p>
          </div>
        </div>
      </header>

      {/* Tab nav — bottom bar on mobile, top bar on desktop */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10 sm:block hidden">
        <div className="max-w-3xl mx-auto px-4 flex">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 sm:flex-none sm:px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-green-700 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-1">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-6 pb-24 sm:pb-6">
        {tab === 'dashboard' && (
          <Dashboard rounds={rounds} courses={courses} />
        )}
        {tab === 'entry' && (
          <ScoreEntry courses={courses} onAdd={addRound} />
        )}
        {tab === 'history' && (
          <RoundHistory rounds={rounds} courses={courses} onDelete={deleteRound} />
        )}
        {tab === 'courses' && (
          <CourseManager courses={courses} onChange={setCourses} />
        )}
      </main>

      {/* Mobile bottom navigation */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20">
        <div className="flex">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors ${
                tab === t.id ? 'text-green-700' : 'text-gray-400'
              }`}
            >
              <span className="text-xl leading-none">{t.icon}</span>
              <span className="text-[10px] font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <footer className="mt-12 py-6 text-center text-xs text-gray-400 hidden sm:block">
        WHS 규정 기준 · 데이터는 브라우저 로컬 저장소에 보관
      </footer>
    </div>
  );
}
