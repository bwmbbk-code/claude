import { useMemo, useState } from 'react';
import { Round, Course } from '../types';
import { calcHandicapIndex, calcCourseHandicap, getUsedRoundIds } from '../lib/handicap';

interface Props {
  rounds: Round[];
  courses: Course[];
}

function TrendChart({ rounds }: { rounds: Round[] }) {
  const recent = [...rounds]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-10);

  if (recent.length < 2) return null;

  const diffs = recent.map(r => r.differential);
  const min = Math.min(...diffs) - 1;
  const max = Math.max(...diffs) + 1;
  const range = max - min || 1;

  const W = 340, H = 100, PAD = 10;
  const toX = (i: number) => PAD + (i / (diffs.length - 1)) * (W - PAD * 2);
  const toY = (v: number) => PAD + (1 - (v - min) / range) * (H - PAD * 2);

  const points = diffs.map((d, i) => `${toX(i)},${toY(d)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-24">
      <polyline
        fill="none"
        stroke="#22c55e"
        strokeWidth="2"
        points={points}
      />
      {diffs.map((d, i) => (
        <circle key={i} cx={toX(i)} cy={toY(d)} r="3" fill="#16a34a" />
      ))}
    </svg>
  );
}

export default function Dashboard({ rounds, courses }: Props) {
  const hi = useMemo(() => calcHandicapIndex(rounds), [rounds]);
  const usedIds = useMemo(() => getUsedRoundIds(rounds), [rounds]);

  const recent5 = [...rounds]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id ?? '');
  const selectedCourse = courses.find(c => c.id === selectedCourseId) ?? courses[0] ?? null;

  const courseHandicap = hi !== null && selectedCourse
    ? calcCourseHandicap(hi, selectedCourse.slope, selectedCourse.rating, selectedCourse.par)
    : null;

  const needed = Math.max(0, 3 - rounds.length);

  return (
    <div className="space-y-6">
      {/* Handicap Index card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-green-800 to-green-950 rounded-2xl p-6 text-white shadow-lg">
          <p className="text-green-300 text-sm font-medium mb-1">Handicap Index (WHS)</p>
          {hi !== null ? (
            <p className="text-6xl font-bold tracking-tight">{hi.toFixed(1)}</p>
          ) : (
            <div>
              <p className="text-4xl font-bold text-green-400">—</p>
              <p className="text-green-300 text-sm mt-2">
                {needed > 0
                  ? `라운드 ${needed}개 더 필요 (최소 3개)`
                  : '계산 중...'}
              </p>
            </div>
          )}
          <p className="text-green-400 text-xs mt-3">
            최근 {Math.min(rounds.length, 20)}라운드 기준 · 상위 {usedIds.size}개 평균 × 0.96
          </p>
        </div>

        {/* Course Handicap converter */}
        <div className="bg-white rounded-2xl p-6 shadow border border-gray-100">
          <p className="text-gray-500 text-sm font-medium mb-3">Course Handicap 변환</p>
          <select
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            value={selectedCourseId}
            onChange={e => setSelectedCourseId(e.target.value)}
          >
            {courses.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} (SR {c.slope})
              </option>
            ))}
          </select>
          {courseHandicap !== null ? (
            <p className="text-4xl font-bold text-green-700">
              {courseHandicap > 0 ? '+' : ''}{courseHandicap}
            </p>
          ) : (
            <p className="text-3xl font-bold text-gray-300">—</p>
          )}
          <p className="text-gray-400 text-xs mt-1">
            HI × (SR ÷ 113) + (CR − Par)
          </p>
        </div>
      </div>

      {/* Trend chart */}
      {rounds.length >= 2 && (
        <div className="bg-white rounded-2xl p-5 shadow border border-gray-100">
          <p className="text-gray-600 text-sm font-medium mb-3">Score Differential 추이 (최근 10회)</p>
          <TrendChart rounds={rounds} />
          <div className="flex justify-between text-xs text-gray-400 px-2 mt-1">
            <span>이전</span>
            <span>최근</span>
          </div>
        </div>
      )}

      {/* Recent rounds summary */}
      {recent5.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow border border-gray-100">
          <p className="text-gray-600 text-sm font-medium mb-3">최근 라운드</p>
          <div className="space-y-2">
            {recent5.map(r => {
              const course = courses.find(c => c.id === r.courseId);
              const isUsed = usedIds.has(r.id);
              return (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {isUsed && (
                      <span className="w-2 h-2 rounded-full bg-green-500 inline-block" title="핸디캡 계산에 사용됨" />
                    )}
                    {!isUsed && <span className="w-2 h-2 rounded-full bg-gray-200 inline-block" />}
                    <span className="text-gray-700">{r.date}</span>
                    <span className="text-gray-500">{course?.name ?? '알 수 없음'}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600">{r.adjustedScore}타</span>
                    <span className={`font-semibold ${r.differential <= 0 ? 'text-blue-600' : 'text-gray-700'}`}>
                      {r.differential > 0 ? '+' : ''}{r.differential.toFixed(1)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />
            핸디캡 계산에 포함된 라운드
          </p>
        </div>
      )}

      {rounds.length === 0 && (
        <div className="bg-green-50 border border-green-100 rounded-2xl p-8 text-center">
          <p className="text-4xl mb-3">⛳</p>
          <p className="text-green-800 font-medium">아직 등록된 라운드가 없습니다</p>
          <p className="text-green-600 text-sm mt-1">"라운드 입력" 탭에서 첫 번째 라운드를 추가하세요</p>
        </div>
      )}
    </div>
  );
}
