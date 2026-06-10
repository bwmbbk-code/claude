import { useState } from 'react';
import { Course, Round } from '../types';
import { calcDifferential } from '../lib/handicap';

interface Props {
  courses: Course[];
  onAdd: (round: Round) => void;
}

export default function ScoreEntry({ courses, onAdd }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const [score, setScore] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const course = courses.find(c => c.id === courseId);
  const scoreNum = parseInt(score, 10);
  const differential =
    course && !isNaN(scoreNum)
      ? calcDifferential(scoreNum, course.rating, course.slope)
      : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!course || isNaN(scoreNum) || scoreNum < 54 || scoreNum > 200) return;

    const round: Round = {
      id: `r_${Date.now()}`,
      date,
      courseId,
      adjustedScore: scoreNum,
      differential: calcDifferential(scoreNum, course.rating, course.slope),
    };
    onAdd(round);
    setScore('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-5">라운드 등록</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">날짜</label>
            <input
              type="date"
              value={date}
              max={today}
              onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Course */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">코스</label>
            <select
              value={courseId}
              onChange={e => setCourseId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} — CR {c.rating} / SR {c.slope} / Par {c.par}
                </option>
              ))}
            </select>
          </div>

          {/* Score */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              조정 타수 (AGS)
              <span className="ml-2 text-xs font-normal text-gray-400">ESC 적용 후 총타수</span>
            </label>
            <input
              type="number"
              value={score}
              min={54}
              max={200}
              placeholder="예: 85"
              onChange={e => setScore(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Preview differential */}
          {differential !== null && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="text-xs text-green-600 font-medium mb-1">Score Differential 미리보기</p>
              <p className="text-2xl font-bold text-green-800">
                {differential > 0 ? '+' : ''}{differential.toFixed(1)}
              </p>
              <p className="text-xs text-green-600 mt-1">
                ({scoreNum} − {course!.rating}) × 113 ÷ {course!.slope}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={!score || isNaN(scoreNum) || !courseId}
            className="w-full bg-green-700 hover:bg-green-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-2.5 rounded-xl transition-colors"
          >
            {submitted ? '저장 완료!' : '라운드 저장'}
          </button>
        </form>

        {/* ESC guide */}
        <details className="mt-5">
          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
            ESC (Equitable Stroke Control) 가이드
          </summary>
          <div className="mt-3 bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
            <p className="font-medium mb-2">코스 핸디캡별 홀당 최대 타수</p>
            <table className="w-full text-center">
              <thead>
                <tr className="text-gray-400">
                  <th className="pb-1">Course HCP</th>
                  <th className="pb-1">홀 최대</th>
                </tr>
              </thead>
              <tbody className="space-y-1">
                {[
                  ['0 – 9', '7'],
                  ['10 – 19', '8'],
                  ['20 – 29', '9'],
                  ['30 – 39', '10'],
                  ['40+', '11'],
                ].map(([hcp, max]) => (
                  <tr key={hcp}>
                    <td className="py-0.5">{hcp}</td>
                    <td className="py-0.5 font-medium text-green-700">{max}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </div>
  );
}
