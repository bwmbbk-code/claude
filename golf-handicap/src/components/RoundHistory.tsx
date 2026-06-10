import { useMemo, useState } from 'react';
import { Round, Course } from '../types';
import { getUsedRoundIds, calcDifferential } from '../lib/handicap';
import TeeBadge from './TeeBadge';

interface Props {
  rounds: Round[];
  courses: Course[];
  onDelete: (id: string) => void;
  onUpdate: (round: Round) => void;
}

interface EditForm {
  date: string;
  courseId: string;
  teeColor: string;
  adjustedScore: number;
}

export default function RoundHistory({ rounds, courses, onDelete, onUpdate }: Props) {
  const usedIds = useMemo(() => getUsedRoundIds(rounds), [rounds]);
  const sorted = [...rounds].sort((a, b) => b.date.localeCompare(a.date));

  const [editing, setEditing] = useState<Round | null>(null);
  const [form, setForm] = useState<EditForm>({ date: '', courseId: '', teeColor: '', adjustedScore: 0 });

  function openEdit(round: Round) {
    setForm({
      date: round.date,
      courseId: round.courseId,
      teeColor: round.teeColor,
      adjustedScore: round.adjustedScore,
    });
    setEditing(round);
  }

  function closeEdit() {
    setEditing(null);
  }

  function handleCourseChange(courseId: string) {
    const course = courses.find(c => c.id === courseId);
    setForm(f => ({
      ...f,
      courseId,
      teeColor: course?.tees[0]?.color ?? f.teeColor,
    }));
  }

  function handleSave() {
    if (!editing) return;
    const course = courses.find(c => c.id === form.courseId);
    const tee = course?.tees.find(t => t.color === form.teeColor);
    if (!course || !tee) return;
    onUpdate({
      ...editing,
      date: form.date,
      courseId: form.courseId,
      teeColor: form.teeColor,
      adjustedScore: form.adjustedScore,
      differential: calcDifferential(form.adjustedScore, tee.rating, tee.slope),
    });
    closeEdit();
  }

  const previewCourse = courses.find(c => c.id === form.courseId);
  const previewTee = previewCourse?.tees.find(t => t.color === form.teeColor);
  const previewDiff = previewTee
    ? calcDifferential(form.adjustedScore, previewTee.rating, previewTee.slope)
    : null;

  if (rounds.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-3">📋</p>
        <p>등록된 라운드가 없습니다</p>
      </div>
    );
  }

  return (
    <>
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
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => openEdit(round)}
                        className="text-gray-400 hover:text-green-600 text-xs mr-2"
                      >
                        편집
                      </button>
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

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-gray-800 mb-4">라운드 편집</h3>

            <div className="space-y-3">
              {/* Date */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">날짜</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Course */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">코스</label>
                <select
                  value={form.courseId}
                  onChange={e => handleCourseChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Tee chips */}
              {previewCourse && (
                <div>
                  <label className="block text-sm text-gray-600 mb-2">티박스</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {previewCourse.tees.map(t => (
                      <button
                        key={t.color}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, teeColor: t.color }))}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-2 text-xs transition-all ${
                          form.teeColor === t.color
                            ? 'border-green-600 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <TeeBadge color={t.color} />
                        <span className="text-gray-500">CR{t.rating}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Score */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">조정 타수 (Adjusted Score)</label>
                <input
                  type="number"
                  min="55"
                  max="150"
                  value={form.adjustedScore}
                  onChange={e => setForm(f => ({ ...f, adjustedScore: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Live differential preview */}
              {previewTee && previewDiff !== null && (
                <div className="bg-gray-50 rounded-xl p-3 text-sm flex items-center justify-between">
                  <span className="text-gray-500">
                    CR {previewTee.rating} / Slope {previewTee.slope}
                  </span>
                  <span className={`font-bold text-lg ${
                    previewDiff <= 0 ? 'text-blue-600'
                    : previewDiff >= 10 ? 'text-red-500'
                    : 'text-gray-700'
                  }`}>
                    Diff {previewDiff > 0 ? '+' : ''}{previewDiff.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={closeEdit}
                className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={!form.date || !form.courseId || !form.teeColor || !form.adjustedScore}
                className="flex-1 bg-green-700 hover:bg-green-800 disabled:bg-gray-200 text-white py-2 rounded-xl text-sm font-medium"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
