import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LightPillar from './components/LightPillar';

// --- Icons ---
const KeyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
);
const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
);
const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
);
const MagicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
);

export default function QuizAssessment() {
  const navigate = useNavigate();
  const [quizCode, setQuizCode] = useState('');

  const handleStart = (e) => {
    e.preventDefault();
    if (quizCode.trim().length < 5) {
        alert("Please enter a valid Quiz Code.");
        return;
    }
    // Navigate to the player with the entered code
    navigate(`/play/${quizCode.trim()}`);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black font-sans text-white">
      
      {/* 1. Background Layer */}
      <div className="absolute inset-0 z-0">
        <LightPillar
          topColor="#5227FF"
          bottomColor="#FF9FFC"
          intensity={0.8}
          rotationSpeed={0.2}
          pillarWidth={4.0}
          pillarHeight={0.6}
        />
      </div>

      {/* 2. Content Layer */}
      <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
        
        {/* Back Button */}
        <button 
            onClick={() => navigate('/dashboard')}
            className="absolute top-6 left-6 flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
        >
            <ArrowLeftIcon />
            <span>Back to Dashboard</span>
        </button>

        {/* Glass Card */}
        <div className="w-full max-w-lg bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl animate-fade-in-up text-center">
          
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 mb-6">
            <KeyIcon />
          </div>

          <h2 className="text-3xl font-bold mb-3 text-white">
            Enter Access Code
          </h2>
          <p className="text-gray-400 text-sm mb-8">
            Please enter the unique code provided for your quiz session.
          </p>

          <form onSubmit={handleStart} className="space-y-6">
            
            {/* Code Input */}
            <div className="relative group">
                <input 
                    type="text" 
                    placeholder="e.g. U0LUGUU880" 
                    value={quizCode}
                    onChange={(e) => setQuizCode(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-center text-xl font-mono text-white tracking-widest placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all uppercase"
                />
            </div>

            {/* Start Button */}
            <button 
                type="submit"
                className="w-full py-4 flex items-center justify-center space-x-2 bg-white text-black rounded-xl font-bold text-lg shadow-lg hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
                <span>Start Assessment</span>
                <ArrowRightIcon />
            </button>

          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest text-gray-500"><span className="px-2 bg-transparent backdrop-blur-xl">Or</span></div>
          </div>

          {/* No Code Section */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/5">
            <p className="text-gray-300 text-sm mb-4">
                Don't have a Quiz code? Create your own quiz instantly using our AI.
            </p>
            <button 
                onClick={() => navigate('/generate')}
                className="w-full py-3 flex items-center justify-center space-x-2 bg-purple-600/20 border border-purple-500/50 text-purple-200 rounded-lg text-sm font-semibold hover:bg-purple-600/30 transition-all"
            >
                <span>Generate Your Own Quiz</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}