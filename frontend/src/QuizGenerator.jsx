import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LightPillar from './components/LightPillar';

// --- Icons ---
const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
);
const GlobeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
);
const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
);
const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
const SignalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20v-12"/><path d="M22 20v-16"/></svg>
);
// NEW ICON for Attempts
const RepeatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
);

export default function QuizGenerator() {
  const navigate = useNavigate();
   
  // --- STATE ---
  const [activeTab, setActiveTab] = useState('web'); 
  const [questionCount, setQuestionCount] = useState(5);
  const [timeLimit, setTimeLimit] = useState(30); 
  const [difficulty, setDifficulty] = useState('Medium'); 
  const [attempts, setAttempts] = useState(1); // NEW STATE
  const [topic, setTopic] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const difficulties = ['Easy', 'Medium', 'Hard', 'Expert'];

  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // 1. Prepare Data
    const formData = new FormData();
    formData.append('activeTab', activeTab);
    formData.append('questionCount', questionCount);
    formData.append('timeLimit', timeLimit);
    formData.append('difficulty', difficulty);
    formData.append('attempts', attempts); // SEND TO BACKEND

    if (activeTab === 'web') {
      if (!topic) {
        alert("Please enter a topic!");
        setIsLoading(false);
        return;
      }
      formData.append('topic', topic);
    } else {
      if (!selectedFile) {
        alert("Please select a file to upload!");
        setIsLoading(false);
        return;
      }
      formData.append('file', selectedFile);
    }

    // 2. Send to Backend
    try {
      const response = await fetch('http://localhost:5000/api/generate', {
        method: 'POST',
        body: formData,
        credentials: 'include' 
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Quiz Generated Successfully!\nQuiz Code to attempt quiz: ${data.quiz_code}\nQuestions: ${data.count}\n\nOn clicking OK, you will be redirected to dashboard\nwhere you can print/download the quiz.`);
        navigate('/dashboard'); 
      } else {
        alert("Server Error: " + data.message);
      }
    } catch (error) {
      console.error("Generator Error:", error);
      alert("Failed to connect to server. Check if Python is running.");
    } finally {
      setIsLoading(false);
    }
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
        <div className="w-full max-w-xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl animate-fade-in-up">
          
          <h2 className="text-3xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">
            Create New Quiz
          </h2>
          <p className="text-center text-gray-400 text-sm mb-8">
            Configure your session parameters.
          </p>

          <form onSubmit={handleGenerate} className="space-y-6">
            
            {/* Toggle Switch */}
            <div className="flex p-1 bg-black/40 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setActiveTab('web')}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                  activeTab === 'web' 
                    ? 'bg-purple-600/80 text-white shadow-lg shadow-purple-500/20' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <GlobeIcon />
                <span>Web Topic</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('local')}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                  activeTab === 'local' 
                    ? 'bg-pink-600/80 text-white shadow-lg shadow-pink-500/20' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <UploadIcon />
                <span>Local File</span>
              </button>
            </div>

            {/* Input Section */}
            <div className="min-h-[80px]">
                {activeTab === 'web' ? (
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Search Topic</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Quantum Physics, History of Rome..." 
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                            required={activeTab === 'web'}
                        />
                    </div>
                ) : (
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Upload Document (PDF/TXT)</label>
                        <div className="relative group">
                            <input 
                                type="file" 
                                onChange={(e) => setSelectedFile(e.target.files[0])}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                required={activeTab === 'local'}
                            />
                            <div className="w-full bg-black/30 border-2 border-dashed border-white/20 group-hover:border-pink-500/50 rounded-xl px-4 py-4 flex flex-col items-center justify-center text-gray-400 transition-all">
                                <UploadIcon />
                                <span className="mt-2 text-sm">{selectedFile ? selectedFile.name : "Click or Drag file here"}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Grid: Questions, Time, Attempts (UPDATED TO 3 COLUMNS) */}
            <div className="grid grid-cols-3 gap-4">
                {/* 1. Question Count */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Questions</label>
                    <input 
                        type="number" 
                        min="1" 
                        max="50" 
                        value={questionCount}
                        onChange={(e) => setQuestionCount(e.target.value)}
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all text-center"
                    />
                </div>
                
                {/* 2. Time Limit */}
                <div className="space-y-2">
                    <label className="flex items-center justify-center space-x-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <ClockIcon />
                        <span>Time per Question</span>
                    </label>
                    <select 
                        value={timeLimit}
                        onChange={(e) => setTimeLimit(e.target.value)}
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-2 py-3 text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all appearance-none text-center"
                    >
                        <option value="15">15s</option>
                        <option value="30">30s</option>
                        <option value="45">45s</option>
                        <option value="60">1m</option>
                        <option value="120">2m</option>
                    </select>
                </div>

                {/* 3. Attempts (NEW) */}
                <div className="space-y-2">
                    <label className="flex items-center justify-center space-x-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <RepeatIcon />
                        <span>Attempts/user</span>
                    </label>
                    <input 
                        type="number" 
                        min="1" 
                        max="10" 
                        value={attempts}
                        onChange={(e) => setAttempts(e.target.value)}
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-center"
                    />
                </div>
            </div>

            {/* Difficulty Selector */}
            <div className="space-y-2">
                <label className="flex items-center space-x-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <SignalIcon />
                    <span>Difficulty</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                    {difficulties.map((level) => (
                        <button
                            key={level}
                            type="button"
                            onClick={() => setDifficulty(level)}
                            className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                                difficulty === level
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-transparent text-white shadow-lg'
                                    : 'bg-black/30 border-white/10 text-gray-500 hover:text-gray-300 hover:bg-white/5'
                            }`}
                        >
                            {level}
                        </button>
                    ))}
                </div>
            </div>

            {/* Generate Button */}
            <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-lg shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
                {isLoading ? "Generating... Please wait" : "Generate Quiz"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}