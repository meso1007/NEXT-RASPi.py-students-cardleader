"use client"
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Clock, CheckCircle, XCircle, Users, Calendar, Wifi, Battery, AlertCircle, BookOpen } from 'lucide-react';
import type { Variants } from 'framer-motion';
import { easeInOut } from 'framer-motion';

// 型定義
interface Student {
  id: string;
  name: string;
  year: string;
  department: string;
  timestamp: string;
}

interface AttendanceData {
  type: string;
  success: boolean;
  status: string;
  student?: Student;
  timestamp: string;
  message: string;
}

function formatTime(sec: number) {
  if (sec == null || isNaN(sec)) return '';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const AttendanceSystem = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [showMessage, setShowMessage] = useState(false);
  const [currentClass, setCurrentClass] = useState('Unknown');
  const REGISTERED_STUDENTS_KEY = "registeredStudents";
  const DEFAULT_REGISTERED_STUDENTS: Student[] = [];
  const [leftTime, setLeftTime] = useState(0);
  const [remaining, setRemaining] = useState<number>(0);

  const [registeredStudents, setRegisteredStudents] = useState<Student[]>([]);
  useEffect(() => {
    const stored = sessionStorage.getItem('registeredStudents');
    if (stored) {
      try {
        setRegisteredStudents(JSON.parse(stored));
      } catch {}
    }
  }, []);
  const total = 50;
  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    total: 50,
    rate: 0
  });
  useEffect(() => {
    setAttendanceStats({
      present: registeredStudents.length,
      total: 50,
      rate: Math.round((registeredStudents.length / 50) * 100)
    });
  }, [registeredStudents]);

  // バックエンドからのデータ受信をシミュレート
  useEffect(() => {
    const classTitle = sessionStorage.getItem('classTitle');
    if (classTitle) {
      setCurrentClass(classTitle);
    }
    const leftTime = sessionStorage.getItem('classTimer');
    if (leftTime) {
      setLeftTime(Number(leftTime));
    }

    const handleMessage = (event: MessageEvent) => {
      // バックエンドからのメッセージを受信
      if (event.data && event.data.type === 'attendance') {
        setAttendanceData(event.data);
        setShowMessage(true);
        
        // 出席成功時、登録済み学生リストに追加
        if (event.data.success && event.data.status === 'present' && event.data.student) {
          const newStudent = {
            ...event.data.student,
            timestamp: event.data.timestamp
          };
          
          // 既に登録済みでないかチェック
          const isAlreadyRegistered = registeredStudents.some((student: Student) => student.id === newStudent.id);
          
          if (!isAlreadyRegistered) {
            setRegisteredStudents((prev: Student[]) => [newStudent, ...prev]);
          }
        }
        
        // 統計更新
        if (event.data.success && event.data.status === 'present') {
          setAttendanceStats(prev => ({
            ...prev,
            present: prev.present + 1,
            rate: Math.round(((prev.present + 1) / prev.total) * 100)
          }));
        }
        
        // 5秒後にメッセージを非表示
        setTimeout(() => {
          setShowMessage(false);
          setAttendanceData(null);
        }, 1500);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [registeredStudents]);

  useEffect(() => {
    sessionStorage.setItem(REGISTERED_STUDENTS_KEY, JSON.stringify(registeredStudents));
  }, [registeredStudents]);

  // 時計の更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const updateRemaining = () => {
      const end = sessionStorage.getItem('classTimerEnd');
      if (end) {
        const endTime = parseInt(end, 10);
        const now = Date.now();
        const diff = Math.max(0, Math.floor((endTime - now) / 1000));
        setRemaining(diff);
      } else {
        setRemaining(0);
      }
    };
    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, []);

  // テスト用のデータ送信（実際の使用では削除）
  const simulateBackendData = (success: boolean, status: string = 'present') => {
    const testData = {
      type: 'attendance',
      success: success,
      status: status,
      student: {
        id: '12561526516256',
        name: '田中 太郎',
        year: '2年',
        department: '情報工学科'
      },
      timestamp: new Date().toISOString(),
      message: success ? '出席が記録されました' : 'カードが認識できませんでした'
    };
    
    window.postMessage(testData, '*');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: easeInOut
      }
    }
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.02, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: easeInOut
      }
    }
  };

  const messageVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: 100
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 300
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: -100,
      transition: {
        duration: 0.3,
        ease: easeInOut
      }
    }
  };

  return (
    <div className="min-h-screen bg-white text-black overflow-hidden relative">
      {/* グリッドパターン */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      
      {/* ヘッダー */}
      <motion.header 
        className="relative z-10 px-8 py-6 border-b border-gray-200"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <motion.div 
              className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <Users className="w-6 h-6" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold">出欠システム</h1>
              <p className="text-gray-600 text-sm">{currentClass}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3 text-gray-600">
              <Wifi className="w-5 h-5" />
              <Battery className="w-5 h-5" />
            </div>
            <div className="text-center text-lg font-mono text-blue-600">
             残り時間: {formatTime(remaining)}
           </div>
            <div className="text-right">
              <motion.div 
                className="text-4xl font-mono font-bold"
                key={currentTime.getMinutes()}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {currentTime.toLocaleTimeString('ja-JP', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </motion.div>
              <div className="text-sm text-gray-600">
                {currentTime.toLocaleDateString('ja-JP', { 
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'short'
                })}
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* メインコンテンツ */}
      <motion.main 
        className="container mx-auto px-8 py-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <motion.div 
            className="bg-gray-50 border border-gray-200 rounded-2xl p-8 hover:border-blue-500 hover:shadow-lg transition-all duration-300 z-20"
            variants={itemVariants}
            whileHover={{ y: -5 }}
          >
            <div className="flex items-center justify-between mb-6">
              <CheckCircle className="w-10 h-10 text-blue-500" />
              <div className="text-4xl font-bold text-blue-500">{attendanceStats.present}</div>
            </div>
            <h3 className="text-xl font-semibold mb-2">出席者数</h3>
            <p className="text-gray-600">今日の出席状況</p>
          </motion.div>

          <motion.div 
            className="bg-gray-50 border border-gray-200 rounded-2xl p-8 hover:border-purple-500 hover:shadow-lg transition-all duration-300 z-20"
            variants={itemVariants}
            whileHover={{ y: -5 }}
          >
            <div className="flex items-center justify-between mb-6">
              <Users className="w-10 h-10 text-purple-500" />
              <div className="text-4xl font-bold text-purple-500">{attendanceStats.total}</div>
            </div>
            <h3 className="text-xl font-semibold mb-2">総学生数</h3>
            <p className="text-gray-600">登録済み学生</p>
          </motion.div>

          <motion.div 
            className="bg-gray-50 border border-gray-200 rounded-2xl p-8 hover:border-green-500 hover:shadow-lg transition-all duration-300 z-20"
            variants={itemVariants}
            whileHover={{ y: -5 }}
          >
            <div className="flex items-center justify-between mb-6">
              <Calendar className="w-10 h-10 text-green-500" />
              <div className="text-4xl font-bold text-green-500">{attendanceStats.rate}%</div>
            </div>
            <h3 className="text-xl font-semibold mb-2">出席率</h3>
            <p className="text-gray-600">本日の出席率</p>
          </motion.div>
        </div>

        {/* カードタッチエリア */}
        <motion.div 
          className="bg-gray-50 border border-gray-200 rounded-3xl p-16 text-center relative overflow-hidden"
          variants={itemVariants}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
          
          <motion.div
            className="relative z-10"
            variants={pulseVariants}
            animate="animate"
          >
            <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-16 h-16 text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-4">学生証をタッチしてください</h2>
            <p className="text-xl text-gray-600 mb-12">カードリーダーに学生証を近づけて出席を記録</p>
            
            {/* 波紋エフェクト */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="w-64 h-64 border-2 border-blue-500/30 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0, 0.3]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: easeInOut
                }}
              />
              <motion.div
                className="absolute w-96 h-96 border-2 border-purple-500/20 rounded-full"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.2, 0, 0.2]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: easeInOut,
                  delay: 0.5
                }}
              />
            </div>
          </motion.div>
        </motion.div>

        {/* 登録済み学生一覧 */}
        <motion.div 
          className="mt-16"
          variants={itemVariants}
        >
          <div className="flex items-center space-x-3 mb-8">
            <BookOpen className="w-8 h-8 text-blue-500" />
            <h2 className="text-3xl font-bold">登録済み学生一覧</h2>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
              {registeredStudents.length}名
            </span>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm font-semibold text-gray-600">
                <div>学籍番号</div>
                <div>登録時刻</div>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {registeredStudents.map((student: Student, index: number) => (
                <motion.div
                  key={student.id}
                  className={`px-6 py-4 border-b border-gray-100 hover:bg-gray-50 hover:border-blue-300 hover:shadow-sm transition-all duration-200 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 5 }}
                >
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <div>
                      <span className="font-mono font-semibold text-blue-600 text-lg">{student.id}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(student.timestamp).toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {registeredStudents.length === 0 && (
                <div className="px-6 py-12 text-center text-gray-500">
                  <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>まだ登録された学生はいません</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* テスト用ボタン（実際の使用では削除） */}
        <motion.div 
          className="flex justify-center space-x-4 mt-8"
          variants={itemVariants}
        >
          <button
            onClick={() => simulateBackendData(true, 'present')}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-all duration-200 hover:scale-105 z-20 hover:bg-green-800 cursor-pointer"
          >
            成功テスト
          </button>
          <button
            onClick={() => simulateBackendData(false)}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-all duration-200  hover:scale-105 z-20 hover:bg-red-800 cursor-pointer"
          >
            失敗テスト
          </button>
        </motion.div>
      </motion.main>

      {/* 成功/失敗メッセージ */}
      <AnimatePresence>
        {showMessage && attendanceData && (
          <motion.div
            className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50 p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={`bg-white border-2 ${
                attendanceData.success 
                  ? 'border-green-500/50 bg-green-500/5' 
                  : 'border-red-500/50 bg-red-500/5'
              } rounded-3xl p-12 text-center max-w-md mx-auto shadow-2xl`}
              variants={messageVariants as Variants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className={`w-20 h-20 mx-auto mb-8 rounded-full flex items-center justify-center ${
                attendanceData.success 
                  ? 'bg-green-500' 
                  : 'bg-red-500'
              }`}>
                {attendanceData.success ? (
                  <CheckCircle className="w-10 h-10 text-white" />
                ) : (
                  <XCircle className="w-10 h-10 text-white" />
                )}
              </div>
              
              <h3 className="text-3xl font-bold mb-4">
                {attendanceData.success ? '出席登録完了' : '登録失敗'}
              </h3>
              
              {attendanceData.success && attendanceData.student && (
                <div className="mb-6">
                  <p className="text-2xl font-semibold mb-2">{attendanceData.student.name}</p>
                  <p className="text-gray-600">
                    {attendanceData.student.id} • {attendanceData.student.year} • {attendanceData.student.department}
                  </p>
                </div>
              )}
              
              <p className={`text-lg ${
                attendanceData.success ? 'text-green-400' : 'text-red-400'
              }`}>
                {attendanceData.message}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AttendanceSystem;