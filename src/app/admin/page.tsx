"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const TeacherPage = () => {
  const [classTitle, setClassTitle] = useState('');
  const [timer, setTimer] = useState(30);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const router = useRouter();

  // ページ初期化時、sessionStorageからタイマー状態・タイトル・分数を復元
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

  const handleStart = () => {
    setStarted(true);
    sessionStorage.setItem('classTitle', classTitle);
    sessionStorage.setItem('classTimer', timer.toString());
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
      } catch {}
    }
    setStudentIds(ids);
    setEnded(true);
    setStarted(false);
    setRemaining(null);
    sessionStorage.removeItem('classTimerEnd');
    sessionStorage.removeItem('classTimerStarted');
    sessionStorage.removeItem('classTitle');
    sessionStorage.removeItem('classTimer');
  };

  const downloadCSV = () => {
    const csv = 'id\n' + studentIds.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'registered_students.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (sec: number | null) => {
    if (sec === null) return '';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

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
            className="w-full py-4 bg-gray-900 text-white rounded-full font-light text-lg hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={downloadCSV}
            disabled={studentIds.length === 0}
          >
            CSVダウンロード
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

export default TeacherPage;