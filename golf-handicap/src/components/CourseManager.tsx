import { useState } from 'react';
import { Course } from '../types';

interface Props {
  courses: Course[];
  onChange: (courses: Course[]) => void;
}

const EMPTY: Omit<Course, 'id'> = { name: '', rating: 72.0, slope: 113, par: 72 };

export default function CourseManager({ courses, onChange }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  function handleSave() {
    if (!form.name.trim()) return;
    if (editId) {
      onChange(courses.map(c => c.id === editId ? { ...form, id: editId } : c));
      setEditId(null);
    } else {
      onChange([...courses, { ...form, id: `c_${Date.now()}` }]);
    }
    setForm(EMPTY);
    setShowForm(false);
  }

  function handleEdit(c: Course) {
    setForm({ name: c.name, rating: c.rating, slope: c.slope, par: c.par });
    setEditId(c.id);
    setShowForm(true);
  }

  function handleDelete(id: string) {
    if (confirm('이 코스를 삭제할까요? 연결된 라운드 기록은 유지되지만 코스명이 표시되지 않을 수 있습니다.')) {
      onChange(courses.filter(c => c.id !== id));
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">코스 목록</h2>
          <button
            onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(true); }}
            className="bg-green-700 hover:bg-green-800 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
          >
            + 코스 추가
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left">코스명</th>
                <th className="px-4 py-3 text-center">Course Rating</th>
                <th className="px-4 py-3 text-center">Slope Rating</th>
                <th className="px-4 py-3 text-center">Par</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {courses.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{c.rating.toFixed(1)}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{c.slope}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{c.par}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleEdit(c)}
                      className="text-gray-400 hover:text-green-600 text-sm mr-3 transition-colors"
                    >
                      편집
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slope Rating 참고 */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-800">
        <p className="font-semibold mb-1">Slope Rating 기준</p>
        <p>표준(기준) 골퍼 기준 55(최소) ~ 155(최대), 표준값 113. 코스 스코어카드 또는 공식 핸디캡 사이트에서 확인하세요.</p>
      </div>

      {/* Add/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-gray-800 mb-4">
              {editId ? '코스 편집' : '코스 추가'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">코스명</label>
                <input
                  type="text"
                  value={form.name}
                  placeholder="예: 한양CC 서코스"
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Course Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    min="60"
                    max="85"
                    value={form.rating}
                    onChange={e => setForm(f => ({ ...f, rating: parseFloat(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Slope</label>
                  <input
                    type="number"
                    min="55"
                    max="155"
                    value={form.slope}
                    onChange={e => setForm(f => ({ ...f, slope: parseInt(e.target.value, 10) }))}
                    className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Par</label>
                  <input
                    type="number"
                    min="68"
                    max="74"
                    value={form.par}
                    onChange={e => setForm(f => ({ ...f, par: parseInt(e.target.value, 10) }))}
                    className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setShowForm(false); setEditId(null); }}
                className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name.trim()}
                className="flex-1 bg-green-700 hover:bg-green-800 disabled:bg-gray-200 text-white py-2 rounded-xl text-sm font-medium transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
