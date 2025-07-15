"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const STUDENT_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '1234';

const AdminPage = () => {
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [totalStudents, setTotalStudents] = useState(0);

  // TeacherPage state
  const [classTitle, setClassTitle] = useState('');
  const [timer, setTimer] = useState(30);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (sessionStorage.getItem('studentAuthed') === '1') {
      setAuthed(true);
    }
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem('totalStudents');
    if (stored) {
      setTotalStudents(Number(stored));
    }
  }, []);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === STUDENT_PASSWORD) {
      setAuthed(true);
      setError('');
    } else {
      setError('パスワードが違います');
    }
  };

  // TeacherPage logic
  useEffect(() => {
    const end = sessionStorage.getItem('classTimerEnd');
    const startedFlag = sessionStorage.getItem('classTimerStarted');
    const savedTitle = sessionStorage.getItem('classTitle');
    const savedTimer = sessionStorage.getItem('classTimer');
    if (savedTitle) setClassTitle(savedTitle);
    if (savedTimer) setTimer(Number(savedTimer));
    if (end && startedFlag === '1' && !ended) {
      setStarted(true);
      const endTime = parseInt(end, 10);
      const now = Date.now();
      const diff = Math.max(0, Math.floor((endTime - now) / 1000));
      setRemaining(diff);
      if (diff <= 0) {
        handleEnd();
      }
    }
  }, []);

  // タイマー監視
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (started && !ended) {
      interval = setInterval(() => {
        const end = sessionStorage.getItem('classTimerEnd');
        if (end) {
          const endTime = parseInt(end, 10);
          const now = Date.now();
          const diff = Math.max(0, Math.floor((endTime - now) / 1000));
          setRemaining(diff);
          if (diff <= 0) {
            handleEnd();
          }
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [started, ended]);

  // 変更時に保存
  useEffect(() => {
    sessionStorage.setItem('totalStudents', totalStudents.toString());
  }, [totalStudents]);

  const handleStart = () => {
    setStarted(true);
    sessionStorage.setItem('classTitle', classTitle);
    sessionStorage.setItem('classTimer', timer.toString());
    sessionStorage.setItem('totalStudents', totalStudents.toString())
    const endTime = Date.now() + timer * 60 * 1000;
    sessionStorage.setItem('classTimerEnd', endTime.toString());
    sessionStorage.setItem('classTimerStarted', '1');
    setRemaining(timer * 60);
    router.push('/');
  };

  const handleEnd = () => {
    const raw = sessionStorage.getItem('registeredStudents');
    let ids: string[] = [];
    if (raw) {
      try {
        const students = JSON.parse(raw);
        ids = students.map((s: any) => s.id);
      } catch { }
    }
    setStudentIds(ids);
    setEnded(true);
    setStarted(false);
    setRemaining(null);
    sessionStorage.removeItem('classTimerEnd');
    sessionStorage.removeItem('classTimerStarted');
    sessionStorage.removeItem('totalStudents')
    sessionStorage.removeItem('classTitle');
    sessionStorage.removeItem('classTimer');
  };

  const downloadCSV = () => {
    // 必要なデータ
    // classTitle, totalStudentsはstateから取得
    const present = studentIds.length;
    const rate = totalStudents > 0 ? Math.round((present / totalStudents) * 100) : 0;

    // ヘッダー
    let csv = 'クラス名,総人数,出席率,学籍番号\n';
    // 1行目（タイトル、人数、出席率、最初の学籍番号）
    if (studentIds.length > 0) {
      csv += `${classTitle},${totalStudents}人,${rate}%,${studentIds[0]}\n`;
      // 2行目以降（学籍番号のみ）
      for (let i = 1; i < studentIds.length; i++) {
        csv += `,,,${studentIds[i]}\n`;
      }
    } else {
      csv += `${classTitle},${totalStudents},${rate},\n`;
    }

    // ダウンロード処理
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // ファイル名を「日付_クラス名_attendance.csv」にする
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    // クラス名からファイル名に使えない文字を除去
    const safeClassTitle = classTitle.replace(/[^a-zA-Z0-9一-龠ぁ-んァ-ンー_\-]/g, '');
    a.download = `${y}${m}${d}_${safeClassTitle}_attendance.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const goBack = () => {
    router.push('/');
  };

  const formatTime = (sec: number | null) => {
    if (sec === null) return '';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // --- 認証画面 ---
  if (!authed) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-thin text-gray-900 mb-4">ログイン</h1>
            <div className="w-16 h-px bg-gray-900 mx-auto"></div>
          </div>

          <form onSubmit={handleAuth} className="space-y-6 mb-10">
            <div>
              <label className="block mb-3 text-lg font-light text-gray-900">パスワード</label>
              <input
                type="password"
                className="w-full border-0 border-b border-gray-200 bg-transparent px-0 py-4 text-lg font-light text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-0 transition-colors duration-200"
                placeholder="パスワードを入力"
                value={input}
                onChange={e => setInput(e.target.value)}
              />
              {error && <div className="mt-2 text-red-500 text-sm font-light">{error}</div>}
            </div>
          </form>

          <button
            type="submit"
            onClick={handleAuth}
            className="w-full py-4 bg-gray-900 text-white rounded-full font-light text-lg hover:bg-gray-800 transition-all duration-200"
          >
            ログイン
          </button>
        </div>
      </div>
    );
  }

  // --- ここから元のTeacherPageのUI ---
  if (ended) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-thin text-gray-900 mb-4">出席登録完了</h1>
            <div className="w-16 h-px bg-gray-900 mx-auto"></div>
          </div>

          <div className="bg-gray-50 rounded-3xl p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <span className="text-lg font-light text-gray-900">登録生徒</span>
              <span className="text-2xl font-thin text-gray-900">{studentIds.length}名</span>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {studentIds.length === 0 ? (
                <div className="text-center py-8 text-gray-400 font-light">登録者なし</div>
              ) : (
                <div className="space-y-2">
                  {studentIds.map(id => (
                    <div key={id} className="py-2 px-4 bg-white rounded-xl text-gray-900 font-mono text-sm">
                      {id}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            className="w-full py-4 bg-gray-900 text-white rounded-full font-light text-lg hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            onClick={downloadCSV}
            disabled={studentIds.length === 0}
          >
            CSVダウンロード
          </button>
          <button
            className="w-full mt-4 py-4 bg-gray-900 text-white rounded-full font-light text-lg hover:bg-gray-800 transition-all duration-200 cursor-pointer"
            onClick={goBack}
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  if (started && !ended) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-lg text-center">
          <div className="mb-12">
            <h1 className="text-4xl font-thin text-gray-900 mb-4">出席管理</h1>
            <div className="w-16 h-px bg-gray-900 mx-auto"></div>
          </div>

          <div className="bg-gray-50 rounded-3xl p-8 mb-8">
            <div className="text-6xl font-thin text-gray-900 mb-4 font-mono">
              {formatTime(remaining)}
            </div>
            <div className="space-y-2 text-gray-600">
              <div className="font-light">
                <span className="text-gray-400">授業：</span>
                <span className="text-gray-900">{classTitle}</span>
              </div>
              <div className="font-light">
                <span className="text-gray-400">設定時間：</span>
                <span className="text-gray-900">{timer}分</span>
              </div>
            </div>
          </div>

          <button
            className="w-full py-4 bg-gray-900 text-white rounded-full font-light text-lg hover:bg-gray-800 transition-all duration-200"
            onClick={handleEnd}
          >
            終了
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-thin text-gray-900 mb-4">出席管理</h1>
          <div className="w-16 h-px bg-gray-900 mx-auto"></div>
        </div>

        <div className="space-y-6 mb-10">
          <div>
            <label className="block mb-3 text-lg font-light text-gray-900">授業タイトル</label>
            <input
              type="text"
              className="w-full border-0 border-b border-gray-200 bg-transparent px-0 py-4 text-lg font-light text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-0 transition-colors duration-200"
              value={classTitle}
              onChange={e => setClassTitle(e.target.value)}
              placeholder="例: 情報処理基礎"
              disabled={started}
            />
          </div>

          <div>
            <label className="block mb-3 text-lg font-light text-gray-900">タイマー（分）</label>
            <input
              type="number"
              className="w-full border-0 border-b border-gray-200 bg-transparent px-0 py-4 text-lg font-light text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-0 transition-colors duration-200"
              value={timer}
              min={1}
              onChange={e => setTimer(Number(e.target.value))}
              disabled={started}
            />
          </div>
          <div className="font-light">
            <label className="block mb-3 text-lg font-light text-gray-900">総学生数</label>
            <input
              type="number"
              className="w-full border-0 border-b border-gray-200 bg-transparent px-0 py-4 text-lg font-light text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-0 transition-colors duration-200"
              value={totalStudents}
              onChange={e => setTotalStudents(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            className="flex-1 py-4 bg-gray-900 text-white rounded-full font-light text-lg hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleStart}
            disabled={!classTitle || started}
          >
            スタート
          </button>
          <button
            className="flex-1 py-4 border border-gray-900 text-gray-900 rounded-full font-light text-lg hover:bg-gray-900 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-900"
            onClick={handleEnd}
            disabled={!started}
          >
            終了
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;