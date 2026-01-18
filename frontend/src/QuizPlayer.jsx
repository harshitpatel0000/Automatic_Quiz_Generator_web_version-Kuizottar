import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LightPillar from './components/LightPillar';

// --- Icons ---
const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);

export default function QuizPlayer() {
  const { code } = useParams(); 
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userAnswersLog, setUserAnswersLog] = useState([]);
  
  const [selectedOption, setSelectedOption] = useState(null);

  const timerRef = useRef(null);

  // 1. Fetch Quiz Data
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/quiz/${code}`, {
            credentials: 'include'
        });
        if (!res.ok) throw new Error("Quiz not found");
        const data = await res.json();
        setQuiz(data);
        setTimeLeft(data.data.meta?.time_per_question || 30); 
      } catch (err) {
        alert("Error loading quiz: " + err.message);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [code, navigate]);

  // 2. Timer Logic
  useEffect(() => {
    if (isFinished || !quiz) return;
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleNext(false); // Auto-skip if time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentQIndex, isFinished, quiz]);

  // 3. Handlers
  const handleOptionClick = (option) => {
    setSelectedOption(option);
  };

  const confirmAnswer = () => {
    if (!selectedOption) return;
    
    const currentQuestion = quiz.data.questions[currentQIndex];
    const isCorrect = selectedOption === currentQuestion.answer;
    
    // Immediate transition - No visual feedback
    handleNext(isCorrect);
  };

  const handleNext = (isCorrect) => {

    const newLog = [...userAnswersLog, selectedOption];
    setUserAnswersLog(newLog);

    if (isCorrect) setScore(s => s + 1);

    const nextIndex = currentQIndex + 1;
    
    if (nextIndex < quiz.data.questions.length) {
      // Prepare next question
      setCurrentQIndex(nextIndex);
      setSelectedOption(null);
      setTimeLeft(quiz.data.meta?.time_per_question || 30); 
    } else {
      // Finish
      finishQuiz(isCorrect ? score + 1 : score);
    }
  };

  // Update the function signature to accept the log
  const finishQuiz = async (finalScore, finalLog) => {
    setIsFinished(true);
    const scoreString = `${finalScore}/${quiz.data.questions.length}`;
     
    try {
        await fetch(`http://localhost:5000/api/quiz/${code}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // --- NEW: Send 'answers' key ---
        body: JSON.stringify({ score: scoreString, answers: finalLog || userAnswersLog }),
        credentials: 'include'
        });
    } catch (e) {
        console.error("Failed to save score");
    }
  };

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">Initializing Neural Link...</div>;
  if (!quiz) return null;

  const currentQuestion = quiz.data.questions[currentQIndex];
  const totalQuestions = quiz.data.questions.length;
  const progress = ((currentQIndex) / totalQuestions) * 100;

  // --- RENDER: RESULTS SCREEN ---
  if (isFinished) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-black font-sans text-white flex items-center justify-center">
        {/* Background - Blurred */}
        <div className="absolute inset-0 z-0">
            <LightPillar topColor="#00ff88" bottomColor="#0099ff" intensity={0.6} />
        </div>
        <div className="absolute inset-0 z-0 backdrop-blur-lg bg-black/40" />

        <div className="relative z-10 bg-zinc-900/80 backdrop-blur-2xl p-12 rounded-3xl border border-white/10 text-center shadow-2xl max-w-md w-full animate-fade-in-up">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/50">
            <CheckIcon />
          </div>
          <h2 className="text-4xl font-bold mb-2 text-white">Assessment Complete</h2>
          <p className="text-gray-400 mb-8 uppercase tracking-widest text-xs">Final Result</p>
          
          <div className="text-7xl font-mono font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
            {score} / {totalQuestions}
          </div>
          
          <button 
            onClick={() => navigate('/dashboard')} 
            className="w-full py-4 bg-white text-black font-bold rounded-xl hover:scale-[1.02] transition-all shadow-lg"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER: GAMEPLAY SCREEN ---
  return (
    <div className="relative w-full h-screen overflow-hidden bg-black font-sans text-white">
      
      {/* 1. Background Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <LightPillar 
            topColor="#5227FF" 
            bottomColor="#FF9FFC" 
            intensity={0.5} 
            rotationSpeed={0.1}
        />
      </div>
      
      {/* 2. Blur Overlay */}
      <div className="absolute inset-0 z-0 backdrop-blur-md bg-black/40" />

      {/* 3. Content Layer - Adjusted to prevent scrolling */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 h-full flex flex-col justify-center">
        
        {/* Top Bar - Compact */}
        <div className="mb-4">
            <div className="flex justify-between items-end mb-3">
                <div>
                    <h1 className="text-[10px] font-bold text-purple-300 uppercase tracking-widest mb-1 opacity-70">Current Session</h1>
                    <div className="text-lg font-bold text-white">
                    Question {currentQIndex + 1} <span className="text-gray-500 text-base">/ {totalQuestions}</span>
                    </div>
                </div>
                
                {/* Timer */}
                <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border ${timeLeft < 10 ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-white/10 bg-white/5 text-gray-300'}`}>
                    <ClockIcon />
                    <span className="font-mono text-lg font-bold w-8 text-center">{timeLeft}</span>
                </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>

        {/* Question Card - Compact Padding */}
        <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          
          {/* Question Text - Smaller Font */}
          <h2 className="text-xl md:text-2xl font-medium mb-6 leading-relaxed text-white">
            {currentQuestion.question}
          </h2>

          {/* Options Grid - Compact Gaps */}
          <div className="grid grid-cols-1 gap-3">
            {currentQuestion.options.map((option, idx) => {
               const isSelected = selectedOption === option;
               
               // Only change style based on selection (No Green/Red feedback)
               let buttonStyle = isSelected 
                 ? "border-purple-500 bg-purple-500/20 text-white ring-1 ring-purple-500" // Selected State
                 : "border-white/10 bg-black/40 hover:bg-white/5 text-gray-300"; // Default State

               return (
                <button
                    key={idx}
                    onClick={() => handleOptionClick(option)}
                    className={`text-left px-5 py-3 rounded-lg border transition-all duration-200 flex items-center group ${buttonStyle}`}
                >
                    <span className={`flex-shrink-0 w-6 h-6 rounded-full font-mono text-xs flex items-center justify-center mr-3 transition-colors ${isSelected ? 'bg-white text-black' : 'bg-white/10 text-gray-400'}`}>
                        {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-base">{option}</span>
                </button>
               );
            })}
          </div>

          {/* Confirm Button - Always Visible but Disabled State */}
          <div className="mt-6 flex justify-end">
            <button 
                onClick={confirmAnswer}
                disabled={!selectedOption} // Disabled until option picked
                className={`px-8 py-3 font-bold rounded-lg transition-all shadow-lg ${
                    selectedOption 
                    ? "bg-white text-black hover:scale-105 active:scale-95 shadow-white/10" // Active State (Lit Up)
                    : "bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed" // Inactive State (Dark Shade)
                }`}
            >
                Confirm Answer
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}