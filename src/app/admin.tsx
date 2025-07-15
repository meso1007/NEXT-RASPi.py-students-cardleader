"use client"
import React, { useState, useEffect } from 'react';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'adminpass';

const AdminPage = () => {
  const [input, setInput] = useState('');
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (sessionStorage.getItem('adminAuthed') === '1') {
      setAuthed(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === ADMIN_PASSWORD) {
      setAuthed(true);
      setError('');
      sessionStorage.setItem('adminAuthed', '1');
    } else {
      setError('パスワードが違います');
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-6 text-center">管理者ログイン</h1>
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 mb-4"
              placeholder="パスワード"
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            {error && <div className="text-red-500 mb-2 text-sm">{error}</div>}
            <button
              type="submit"
              className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              ログイン
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 認証済みの管理画面（仮）
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">管理者ページ</h1>
        <p>ここに管理者用の機能を実装してください。</p>
      </div>
    </div>
  );
};

export default AdminPage; 