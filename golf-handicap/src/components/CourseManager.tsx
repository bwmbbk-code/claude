import { useState } from 'react';
import { Course, Tee, TeeColor, TEE_COLORS } from '../types';
import TeeBadge from './TeeBadge';

interface Props {
  courses: Course[];
  onChange: (courses: Course[]) => void;
}

type Modal =
  | { type: 'add-course' }
  | { type: 'edit-course'; courseId: string }
  | { type: 'add-tee'; courseId: string }
  | { type: 'edit-tee'; courseId: string; teeColor: string };

const EMPTY_TEE: Omit<Tee, 'color'> = { rating: 72.0, slope: 113, par: 72 };
const EMPTY_COURSE = { name: '', location: '' };

export default function CourseManager({ courses, onChange }: Props) {
  const [expanded, setExpanded] = useState<string | null>(courses[0]?.id ?? null);
  const [modal, setModal] = useState<Modal | null>(null);

  // Form state
  const [courseForm, setCourseForm] = useState(EMPTY_COURSE);
  const [teeForm, setTeeForm] = useState<{ color: TeeColor; rating: number; slope: number; par: number }>({
    color: 'Blue', ...EMPTY_TEE,
  });

  function closeModal() { setModal(null); }

  function handleSaveCourse() {
    if (!courseForm.name.trim()) return;
    if (modal?.type === 'edit-course') {
      onChange(courses.map(c =>
        c.id === modal.courseId ? { ...c, name: courseForm.name, location: courseForm.location } : c
      ));
    } else {
      onChange([...courses, { id: `c_${Date.now()}`, name: courseForm.name, location: courseForm.location, tees: [] }]);
    }
    closeModal();
  }

  function handleSaveTee() {
    if (modal?.type !== 'add-tee' && modal?.type !== 'edit-tee') return;
    const { courseId } = modal;

    onChange(courses.map(c => {
      if (c.id !== courseId) return c;
      const newTee: Tee = { color: teeForm.color, rating: teeForm.rating, slope: teeForm.slope, par: teeForm.par };

      if (modal.type === 'edit-tee') {
        return { ...c, tees: c.tees.map(t => t.color === modal.teeColor ? newTee : t) };
      }
      // add: replace if same color, otherwise append
      const exists = c.tees.find(t => t.color === teeForm.color);
      const tees = exists
        ? c.tees.map(t => t.color === teeForm.color ? newTee : t)
        : [...c.tees, newTee];
      return { ...c, tees };
    }));
    closeModal();
  }

  function deleteTee(courseId: string, teeColor: string) {
    if (!confirm(`${teeColor} 티를 삭제할까요?`)) return;
    onChange(courses.map(c =>
      c.id === courseId ? { ...c, tees: c.tees.filter(t => t.color !== teeColor) } : c
    ));
  }

  function deleteCourse(id: string) {
    if (!confirm('이 코스를 삭제할까요? 연결된 라운드 기록은 유지됩니다.')) return;
    onChange(courses.filter(c => c.id !== id));
  }

  function openAddTee(courseId: string) {
    setTeeForm({ color: 'Blue', ...EMPTY_TEE });
    setModal({ type: 'add-tee', courseId });
  }

  function openEditTee(courseId: string, tee: Tee) {
    setTeeForm({ color: tee.color, rating: tee.rating, slope: tee.slope, par: tee.par });
    setModal({ type: 'edit-tee', courseId, teeColor: tee.color });
  }

  function openAddCourse() {
    setCourseForm(EMPTY_COURSE);
    setModal({ type: 'add-course' });
  }

  function openEditCourse(c: Course) {
    setCourseForm({ name: c.name, location: c.location });
    setModal({ type: 'edit-course', courseId: c.id });
  }

  const isEditingTee = modal?.type === 'edit-tee' || modal?.type === 'add-tee';
  const isEditingCourse = modal?.type === 'edit-course' || modal?.type === 'add-course';

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">코스 관리</h2>
        <button
          onClick={openAddCourse}
          className="bg-green-700 hover:bg-green-800 text-white text-sm font-medium px-4 py-1.5 rounded-lg"
        >
          + 코스 추가
        </button>
      </div>

      {/* Course cards */}
      {courses.map(course => (
        <div key={course.id} className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
          {/* Course header */}
          <div
            className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50"
            onClick={() => setExpanded(expanded === course.id ? null : course.id)}
          >
            <div>
              <p className="font-semibold text-gray-800">{course.name}</p>
              <p className="text-xs text-gray-400">{course.location} · {course.tees.length}개 티</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {course.tees.map(t => <TeeBadge key={t.color} color={t.color} />)}
              </div>
              <button
                onClick={e => { e.stopPropagation(); openEditCourse(course); }}
                className="text-gray-400 hover:text-green-600 text-sm"
              >
                편집
              </button>
              <button
                onClick={e => { e.stopPropagation(); deleteCourse(course.id); }}
                className="text-gray-300 hover:text-red-400 text-lg leading-none"
              >
                ×
              </button>
              <span className="text-gray-400 text-sm">{expanded === course.id ? '▲' : '▼'}</span>
            </div>
          </div>

          {/* Tee list */}
          {expanded === course.id && (
            <div className="border-t border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <th className="px-5 py-2 text-left">티박스</th>
                    <th className="px-4 py-2 text-center">Course Rating</th>
                    <th className="px-4 py-2 text-center">Slope</th>
                    <th className="px-4 py-2 text-center">Par</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {course.tees.map(tee => (
                    <tr key={tee.color} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <TeeBadge color={tee.color} size="md" />
                      </td>
                      <td className="px-4 py-3 text-center font-medium">{tee.rating}</td>
                      <td className="px-4 py-3 text-center font-medium">{tee.slope}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{tee.par}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEditTee(course.id, tee)}
                          className="text-gray-400 hover:text-green-600 text-xs mr-3"
                        >
                          편집
                        </button>
                        <button
                          onClick={() => deleteTee(course.id, tee.color)}
                          className="text-gray-300 hover:text-red-400 text-lg leading-none"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="px-5 py-3 border-t border-gray-50">
                <button
                  onClick={() => openAddTee(course.id)}
                  className="text-green-700 hover:text-green-800 text-sm font-medium"
                >
                  + 티박스 추가
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Slope reference */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-800">
        <p className="font-semibold mb-1">Slope Rating 기준</p>
        <p>55(최소) ~ 155(최대), 표준 113. 코스 스코어카드나 USGA GHIN에서 확인하세요.</p>
      </div>

      {/* ── MODAL ── */}
      {(isEditingTee || isEditingCourse) && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">

            {/* Course form */}
            {isEditingCourse && (
              <>
                <h3 className="font-semibold text-gray-800 mb-4">
                  {modal?.type === 'edit-course' ? '코스 편집' : '코스 추가'}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">코스명</label>
                    <input
                      type="text"
                      value={courseForm.name}
                      placeholder="예: Tumwater Valley Golf Club"
                      onChange={e => setCourseForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">위치</label>
                    <input
                      type="text"
                      value={courseForm.location}
                      placeholder="예: Tumwater, WA"
                      onChange={e => setCourseForm(f => ({ ...f, location: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={closeModal} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm hover:bg-gray-50">취소</button>
                  <button onClick={handleSaveCourse} disabled={!courseForm.name.trim()} className="flex-1 bg-green-700 hover:bg-green-800 disabled:bg-gray-200 text-white py-2 rounded-xl text-sm font-medium">저장</button>
                </div>
              </>
            )}

            {/* Tee form */}
            {isEditingTee && (
              <>
                <h3 className="font-semibold text-gray-800 mb-4">
                  {modal?.type === 'edit-tee' ? '티박스 편집' : '티박스 추가'}
                </h3>
                <div className="space-y-3">
                  {/* Tee color picker */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">티박스 색상</label>
                    <div className="flex gap-2 flex-wrap">
                      {TEE_COLORS.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setTeeForm(f => ({ ...f, color }))}
                          className={`px-3 py-1.5 rounded-lg border-2 transition-all ${
                            teeForm.color === color ? 'border-green-600 bg-green-50' : 'border-gray-200'
                          }`}
                        >
                          <TeeBadge color={color} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Course Rating</label>
                      <input
                        type="number" step="0.1" min="60" max="85"
                        value={teeForm.rating}
                        onChange={e => setTeeForm(f => ({ ...f, rating: parseFloat(e.target.value) }))}
                        className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Slope</label>
                      <input
                        type="number" min="55" max="155"
                        value={teeForm.slope}
                        onChange={e => setTeeForm(f => ({ ...f, slope: parseInt(e.target.value, 10) }))}
                        className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Par</label>
                      <input
                        type="number" min="68" max="74"
                        value={teeForm.par}
                        onChange={e => setTeeForm(f => ({ ...f, par: parseInt(e.target.value, 10) }))}
                        className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 flex items-center gap-2">
                    <TeeBadge color={teeForm.color} size="md" />
                    <span>CR {teeForm.rating} / Slope {teeForm.slope} / Par {teeForm.par}</span>
                  </div>
                </div>

                <div className="flex gap-3 mt-5">
                  <button onClick={closeModal} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm hover:bg-gray-50">취소</button>
                  <button onClick={handleSaveTee} className="flex-1 bg-green-700 hover:bg-green-800 text-white py-2 rounded-xl text-sm font-medium">저장</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
