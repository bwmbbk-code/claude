import { useMemo } from 'react';
import { Round, Course } from '../types';
import { getUsedRoundIds } from '../lib/handicap';
import TeeBadge from './TeeBadge';

interface Props {
  rounds: Round[];
  courses: Course[];
  onDelete: (id: string) => void;
}

export default function RoundHistory({ rounds, courses, onDelete }: Props) {
  const usedIds = useMemo(() => getUsedRoundIds(rounds), [rounds]);
  const sorted = [...rounds].sort((a, b) => b.date.localeCompare(a.date));

  if (rounds.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-3">📋</p>
        <p>등록된 라운드가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">라운드 기록</h2>
        <span className="text-sm text-gray-400">{rounds.length}라운드</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <th className="px-4 py-3 text-left w-4"></th>
              <th className="px-4 py-3 text-left">날짜</th>
              <th className="px-4 py-3 text-left">코스</th>
              <th className="px-4 py-3 text-center">티</th>
              <th className="px-4 py-3 text-center">CR</th>
              <th className="px-4 py-3 text-center">SR</th>
              <th className="px-4 py-3 text-right">조정타수</th>
              <th className="px-4 py-3 text-right">Differential</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map((round, idx) => {
              const course = courses.find(c => c.id === round.courseId);
              const tee = course?.tees.find(t => t.color === round.teeColor);
              const isUsed = usedIds.has(round.id);
              const isOld = idx >= 20;
              return (
                <tr key={round.id} className={`${isOld ? 'opacity-40' : ''} hover:bg-gray-50`}>
                  <td className="px-4 py-3">
                    {isUsed && <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />}
                  </td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{round.date}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">{course?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <TeeBadge color={round.teeColor} />
                  </td>
                  <td className="px-4 py-3 text-center text-gray-400 text-xs">{tee?.rating ?? '—'}</td>
                  <td className="px-4 py-3 text-center text-gray-400 text-xs">{tee?.slope ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-medium">{round.adjustedScore}</td>
                  <td className={`px-4 py-3 text-right font-bold ${
                    round.differential <= 0 ? 'text-blue-600'
                    : round.differential >= 10 ? 'text-red-500'
                    : 'text-gray-700'
                  }`}>
                    {round.differential > 0 ? '+' : ''}{round.differential.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => confirm(`${round.date} 라운드를 삭제할까요?`) && onDelete(round.id)}
                      className="text-gray-300 hover:text-red-400 text-lg leading-none"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 flex gap-4">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />핸디캡 계산에 포함
        </span>
        <span>21번째 이후는 제외</span>
      </div>
    </div>
  );
}
