import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Particles from './components/Particles'; // <--- 1. Import the new component

const TrophyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
);

const PrinterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
);

const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
);

export default function QuizViewer() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);


  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/quiz/${code}`, {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setQuiz(data);

          const leaderboardRes = await fetch(`http://localhost:5000/api/quiz/${code}/leaderboard`, { credentials: 'include' });
          if (leaderboardRes.ok) {
            const lbData = await leaderboardRes.json();
            setLeaderboard(lbData.leaderboard);
          }
        } else {
          alert("Failed to load quiz");
          navigate('/dashboard');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [code, navigate]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading Document...</div>;

  if (!quiz) return null;

  return (
    // 2. Main container needs relative positioning
    <div className="relative min-h-screen w-full bg-black text-white overflow-hidden print:bg-white print:text-black print:overflow-visible">
      
      {/* 3. BACKGROUND LAYER: Absolute position, behind content (z-0), HIDDEN ON PRINT */}
      <div className="absolute inset-0 z-0 print:hidden">
        <Particles
            particleColors={['#ffffff', '#5227FF', '#FF9FFC']} // Using your theme colors
            particleCount={300}
            particleSpread={10}
            speed={0.1}
            particleBaseSize={100}
            moveParticlesOnHover={true}
            alphaParticles={false}
            disableRotation={false}
        />
      </div>

      {/* 4. CONTENT LAYER: Relative position, on top (z-10) */}
      <div className="relative z-10 p-8 print:p-0">
        
        {/* HEADER: Hidden when printing */}
        <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center print:hidden">
            <button 
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
                <ArrowLeftIcon />
                <span>Back</span>
            </button>
            <button 
                onClick={handlePrint}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg font-bold transition-all shadow-lg hover:shadow-purple-500/30"
            >
                <PrinterIcon />
                <span>Print / Save as PDF</span>
            </button>
        </div>

        {/* DOCUMENT CONTAINER: Added backdrop-blur to make text readable over particles */}
        <div className="max-w-4xl mx-auto bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-12 shadow-2xl print:shadow-none print:border-none print:bg-white print:text-black print:p-0">
            
            {/* DOCUMENT TITLE */}
            <div className="border-b border-gray-700 print:border-gray-300 pb-6 mb-8">
                <h1 className="text-3xl font-bold mb-2">{quiz.title}</h1>
                <div className="flex justify-between text-sm text-gray-400 print:text-gray-600">
                    <span>Quiz Code: <span className="font-mono font-bold">{quiz.quiz_code}</span></span>
                    <span>Date: {quiz.created_at}</span>
                    <span>Time Limit: {quiz.data.meta.time_per_question}s per question</span>
                </div>
            </div>

            {/* QUESTIONS SECTION */}
            <div className="space-y-8">
                {quiz.data.questions.map((q, index) => (
                    <div key={index} className="break-inside-avoid">
                        <h3 className="text-lg font-semibold mb-3">
                            {index + 1}. {q.question}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-4">
                            {q.options.map((opt, i) => (
                                <div key={i} className="flex items-center space-x-2">
                                    <span className="w-5 h-5 rounded-full border border-gray-500 flex items-center justify-center text-xs print:border-black">
                                        {String.fromCharCode(65 + i)}
                                    </span>
                                    <span className="text-gray-300 print:text-black">{opt}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* ANSWER KEY SECTION */}
            <div className="mt-16 pt-8 border-t-2 border-dashed border-gray-700 print:border-gray-300 break-before-page">
                <h2 className="text-2xl font-bold mb-6 text-center uppercase tracking-widest">Answer Key</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {quiz.data.questions.map((q, index) => (
                        <div key={index} className="flex justify-between border-b border-gray-800 print:border-gray-200 py-2">
                            <span className="font-bold">Q{index + 1}</span>
                            <span className="text-purple-400 print:text-black font-medium">{q.answer}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. LEADERBOARD SECTION (Now at the very bottom) */}
{leaderboard.length > 0 && (
  <div className="mt-16 pt-8 border-t border-white/10 print:hidden">
    <div className="bg-zinc-900/40 backdrop-blur border border-white/5 rounded-2xl p-8 shadow-2xl">
      <div className="flex items-center mb-6">
        <TrophyIcon />
        <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Candidate Leaderboard</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-500 text-xs uppercase border-b border-white/10">
              <th className="pb-4 px-2">User ID</th>
              <th className="pb-4">Name</th>
              <th className="pb-4">Score</th>
              <th className="pb-4">Percent</th>
              <th className="pb-4">Date</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {leaderboard.map((entry, idx) => (
              <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-4 px-2 text-gray-500 font-mono">#{entry.user_id}</td>
                <td className="py-4 font-bold text-gray-200">{entry.user_name}</td>
                <td className="py-4 text-gray-400">{entry.score}</td>
                <td className="py-4 font-mono font-bold text-green-400">{entry.percentage}</td>
                <td className="py-4 text-gray-500 text-xs">{entry.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-6 text-[10px] text-gray-600 italic">This leaderboard is private and only visible to you (the generator).</p>
    </div>
  </div>
)}

        </div>
      </div>
    </div>
  );
}