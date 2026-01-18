import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LiquidEther from './components/LiquidEther'; 

const GenerateIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-purple-200"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m7.8 16.2-2.9 2.9"/><path d="M2 12h4"/><path d="m7.8 7.8-2.9-2.9"/><circle cx="12" cy="12" r="3"/></svg>);
const AssessIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-pink-200"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="m9 15 2 2 4-4"/></svg>);

// --- Custom Hook for Typewriter Effect ---
const useTypewriter = (text, speed = 100, startTyping = false) => {
  const [displayText, setDisplayText] = useState('');
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (!startTyping) return;
    setDisplayText(''); 
    setIsFinished(false);
    
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < text.length) {
        setDisplayText(text.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
        setIsFinished(true);
      }
    }, speed);

    return () => clearInterval(typingInterval);
  }, [text, speed, startTyping]);

  return { displayText, isFinished };
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null); 
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Initialize state from Session Storage (so it remembers your choice)
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('dashboardActiveTab') || 'generated';
  });

  // 2. Save to Session Storage whenever the tab changes
  useEffect(() => {
    sessionStorage.setItem('dashboardActiveTab', activeTab);
  }, [activeTab]); 

  // Use the hook
  const welcomeMessage = user ? `Welcome, ${user.name}` : ""; 
  const { displayText, isFinished } = useTypewriter(welcomeMessage, 100, !!user);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/dashboard', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        if (response.status === 401) {
          navigate('/');
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setHistory(data.history);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const handleLogout = async () => {
    await fetch('http://localhost:5000/api/logout', { 
        method: 'POST',
        credentials: 'include'
    });
    navigate('/');
  };

  // --- FILTER LOGIC ---
  const filteredHistory = history.filter(item => {
    const itemType = item.type ? item.type.toLowerCase() : '';
    return activeTab === 'generated' 
      ? itemType === 'generated' 
      : itemType === 'assessed';
  });

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black font-sans text-white">
      <div className="absolute inset-0 z-0">
        <LiquidEther colors={['#5227FF', '#FF9FFC', '#B19EEF']} autoDemo={true} />
      </div>
      <div className="relative z-10 w-full h-full overflow-y-auto bg-black/10 backdrop-blur-[2px]">
        <header className="w-full px-8 py-6 flex justify-between items-center border-b border-white/10 bg-white/5 backdrop-blur-md">
          <div className="min-h-[40px] flex items-center"> 
            <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">
              {displayText}
              {!isFinished && <span className="animate-pulse">|</span>}
            </h1>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 text-sm bg-red-500/20 text-red-200 border border-red-500/50 rounded-full hover:bg-red-500/40 transition">
            Logout
          </button>
        </header>
        <main className="max-w-7xl mx-auto px-6 py-10 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* GENERATE BUTTON */}
            <button 
                onClick={() => navigate('/generate')}
                className="group relative flex flex-col items-center justify-center p-10 rounded-3xl border border-white/10 bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all duration-300 shadow-2xl hover:scale-[1.02]"
            >
              <GenerateIcon />
              <h2 className="text-2xl font-bold mb-2">Generate Quiz</h2>
              <p className="text-center text-gray-300">Create a new quiz from text or PDF.</p>
            </button>

            {/* ASSESS BUTTON - Linked to new page */}
            <button 
                onClick={() => navigate('/assess')} 
                className="group relative flex flex-col items-center justify-center p-10 rounded-3xl border border-white/10 bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all duration-300 shadow-2xl hover:scale-[1.02]"
            >
              <AssessIcon />
              <h2 className="text-2xl font-bold mb-2">Assess Quiz</h2>
              <p className="text-center text-gray-300">Grade submissions or take a quiz.</p>
            </button>
          </div>
          
          <section className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-md p-8 shadow-xl">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">Your Quiz History</h3>
                
                {/* TOGGLE SWITCH UI */}
                <div className="inline-flex bg-white/5 p-1 rounded-full border border-white/10">
                    <button 
                    onClick={() => setActiveTab('generated')}
                    className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                        activeTab === 'generated' 
                        ? 'bg-purple-600 text-white shadow-lg' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                    >
                    Generated
                    </button>
                    <button 
                    onClick={() => setActiveTab('assessed')}
                    className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                        activeTab === 'assessed' 
                        ? 'bg-pink-600 text-white shadow-lg' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                    >
                    Assessed
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-gray-400 border-b border-white/10 text-xs uppercase tracking-wider">
                    <th className="py-4 px-4 font-medium">Title</th>
                    <th className="py-4 px-4 font-medium">Code</th>
                    <th className="py-4 px-4 font-medium">Date</th>
                    <th className="py-4 px-4 font-medium">Score</th>
                  </tr>
                </thead>
                <tbody className="text-gray-200 text-sm">
                  {filteredHistory.length > 0 ? (
                    filteredHistory.map((item) => (
                      <tr 
                        key={item.id} 
                        // --- UPDATED LOGIC ---
                        onClick={() => {
                        if (item.type === 'Assessed') {
                         navigate(`/result/${item.id}`); // Go to Result Viewer
                         } else {
                          navigate(`/view/${item.quiz_code}`); // Go to Standard Viewer
                          }
                          }}
                          className="border-b border-white/5 hover:bg-white/10 cursor-pointer..."
                          >
                        <td className="py-4 px-4 font-medium text-white group-hover:text-purple-300 transition-colors">
                            {item.title}
                        </td>
                        <td className="py-4 px-4 font-mono text-purple-200">
                            {item.quiz_code}
                        </td>
                        <td className="py-4 px-4 text-gray-400">{item.date}</td>
                        <td className="py-4 px-4 font-mono">
                            <span className={`px-2 py-1 rounded text-xs ${item.score === 'N/A' ? 'bg-gray-700 text-gray-300' : 'bg-green-900/50 text-green-300 border border-green-700'}`}>
                                {item.score}
                            </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                        <td colSpan="4" className="py-12 text-center text-gray-500 italic">
                          No {activeTab} quizzes found.
                        </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section> 
         </main>
      </div>
    </div>
  );
}