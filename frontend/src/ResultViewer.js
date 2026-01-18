import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Particles from './components/Particles'; 

const PrinterIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>);
const ArrowLeftIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>);

export default function ResultViewer() {
  const { id } = useParams(); // Gets Result ID
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/result/${id}`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setResult(data);
        } else {
          alert("Failed to load result");
          navigate('/dashboard');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [id, navigate]);

  const handlePrint = () => window.print();

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading Result...</div>;
  if (!result) return null;

  return (
    <div className="relative min-h-screen w-full bg-black text-white overflow-hidden print:bg-white print:text-black print:overflow-visible">
      <div className="absolute inset-0 z-0 print:hidden">
        <Particles particleColors={['#ffffff', '#5227FF', '#FF9FFC']} particleCount={200} speed={0.1} />
      </div>

      <div className="relative z-10 p-8 print:p-0">
        <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center print:hidden">
            <button onClick={() => navigate('/dashboard')} className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                <ArrowLeftIcon /><span>Back</span>
            </button>
            <button onClick={handlePrint} className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg font-bold transition-all shadow-lg">
                <PrinterIcon /><span>Print/Download Result</span>
            </button>
        </div>

        <div className="max-w-4xl mx-auto bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-12 shadow-2xl print:shadow-none print:border-none print:bg-white print:text-black print:p-0">
            <div className="border-b border-gray-700 print:border-gray-300 pb-6 mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold mb-2">{result.title}</h1>
                    <div className="text-sm text-gray-400 print:text-gray-600">
                        Attempted on: {result.date}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-gray-400 uppercase tracking-widest">Your Score</div>
                    <div className="text-4xl font-mono font-bold text-purple-400 print:text-black">{result.score}</div>
                </div>
            </div>

            <div className="space-y-8">
                {result.quiz_data.questions.map((q, index) => {
                    // Logic to find user selection
                    const userSelected = result.user_answers[index];
                    const isCorrect = userSelected === q.answer;
                    
                    return (
                    <div key={index} className="break-inside-avoid">
                        <h3 className="text-lg font-semibold mb-3 flex items-start">
                            <span className={`mr-2 ${isCorrect ? 'text-green-500' : 'text-red-500'} print:text-black`}>
                                {index + 1}.
                            </span>
                            {q.question}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-4">
                            {q.options.map((opt, i) => {
                                let optionClass = "text-gray-300 print:text-black"; // Default
                                let icon = String.fromCharCode(65 + i);
                                let borderClass = "border-gray-500 print:border-black";

                                // Highlight Logic
                                if (opt === q.answer) {
                                    // Correct Answer -> Always Green
                                    optionClass = "text-green-400 font-bold print:font-bold print:text-black";
                                    borderClass = "border-green-500 bg-green-500/20 print:border-black";
                                    icon = "✓";
                                } else if (opt === userSelected) {
                                    // Wrong Selection -> Red
                                    optionClass = "text-red-400 print:text-black print:italic";
                                    borderClass = "border-red-500 bg-red-500/20 print:border-black";
                                    icon = "✗";
                                }

                                return (
                                <div key={i} className={`flex items-center space-x-2 p-2 rounded ${opt === userSelected || opt === q.answer ? 'bg-white/5 print:bg-transparent' : ''}`}>
                                    <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${borderClass}`}>
                                        {icon}
                                    </span>
                                    <span className={optionClass}>{opt}</span>
                                    {opt === userSelected && <span className="text-[10px] uppercase ml-2 text-gray-500 print:hidden">(You)</span>}
                                </div>
                            )})}
                        </div>
                    </div>
                )})}
            </div>
        </div>
      </div>
    </div>
  );
}