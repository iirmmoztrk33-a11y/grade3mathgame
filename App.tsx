import React, { useState, useCallback } from 'react';
import { GameState, Character, MathQuestion, GameStats } from './types';
import { CHARACTERS, MAX_QUESTIONS, STUDENTS } from './constants';
import { getMagicalRewardMessage } from './services/geminiService';
import { Button } from './components/Button';
import { CharacterCard } from './components/CharacterCard';

// --- ICONS ---
const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
    <path d="M11.47 3.84a.75.75 0 011.06 0l8.635 8.635a.75.75 0 11-1.06 1.06l-.315-.315V17.98c0 .866-.433 1.587-1.191 1.953a.75.75 0 01-.349.067H15.75a.75.75 0 01-.75-.75v-4.5h-6v4.5a.75.75 0 01-.75.75H5.25a.75.75 0 01-1.5-1.432.75.75 0 01-.04-.348V13.22l-.315.315a.75.75 0 11-1.06-1.06l8.635-8.635z" />
  </svg>
);

const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
    <path fillRule="evenodd" d="M9.53 2.47a.75.75 0 010 1.06L4.81 8.25H15a6.75 6.75 0 010 13.5h-3a.75.75 0 010-1.5h3a5.25 5.25 0 100-10.5H4.81l4.72 4.72a.75.75 0 11-1.06 1.06l-6-6a.75.75 0 010-1.06l6-6a.75.75 0 011.06 0z" clipRule="evenodd" />
  </svg>
);

// --- COMPONENTS ---

const Background = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden">
    {/* Base magical image */}
    <div 
      className="absolute inset-0 bg-cover bg-center bg-no-repeat"
      style={{ 
        backgroundImage: `url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2568&auto=format&fit=crop')`,
        filter: 'brightness(0.6) contrast(1.2) saturate(1.2)'
      }}
    ></div>
    
    {/* Overlay gradients for depth */}
    <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/80 via-purple-900/60 to-slate-900/90"></div>
    
    {/* Floating Particles/Stars */}
    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 animate-pulse"></div>
    
    {/* Animated Orbs */}
    <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-300/20 rounded-full animate-float blur-[40px]"></div>
    <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-500/20 rounded-full animate-float blur-[50px]" style={{ animationDelay: '2s' }}></div>
    <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-blue-400/20 rounded-full animate-float blur-[30px]" style={{ animationDelay: '1s' }}></div>
    
    {/* Vignette */}
    <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.7)]"></div>
  </div>
);

const NavButton = ({ onClick, icon, label, colorClass }: { onClick: () => void, icon: React.ReactNode, label: string, colorClass: string }) => (
  <button 
    onClick={onClick}
    className={`group flex items-center gap-2 px-4 py-2 rounded-2xl border-b-4 ${colorClass} text-white shadow-lg active:scale-95 transition-all active:border-b-0 active:translate-y-1`}
  >
    <span className="group-hover:scale-110 transition-transform">{icon}</span>
    <span className="font-bold hidden md:inline">{label}</span>
  </button>
);

const generateProblem = (): MathQuestion => {
  let n1, n2, sum;
  let isCarry = false;
  
  do {
    n1 = Math.floor(Math.random() * 400) + 100; 
    n2 = Math.floor(Math.random() * 400) + 100; 
    
    const ones1 = n1 % 10;
    const ones2 = n2 % 10;
    const tens1 = Math.floor((n1 % 100) / 10);
    const tens2 = Math.floor((n2 % 100) / 10);

    if (ones1 + ones2 >= 10 || tens1 + tens2 >= 10) {
      isCarry = true;
    } else {
      isCarry = false;
    }
    
    sum = n1 + n2;
  } while (!isCarry);

  return {
    num1: n1,
    num2: n2,
    answer: sum,
    hasCarry: true
  };
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.CHARACTER_SELECT);
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [question, setQuestion] = useState<MathQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [stats, setStats] = useState<GameStats>({ score: 0, correctAnswers: 0, totalQuestions: 0 });
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [finalMessage, setFinalMessage] = useState<string>("");
  const [loadingMessage, setLoadingMessage] = useState<boolean>(false);
  
  // State for "Rounds" (Level)
  const [level, setLevel] = useState<number>(1);

  // Calculate Current Student
  const getCurrentStudent = () => {
    const globalQuestionIndex = ((level - 1) * MAX_QUESTIONS) + stats.totalQuestions;
    return STUDENTS[globalQuestionIndex % STUDENTS.length];
  };

  const startGame = (char: Character) => {
    setSelectedChar(char);
    setStats({ score: 0, correctAnswers: 0, totalQuestions: 0 });
    setQuestion(generateProblem());
    setGameState(GameState.PLAYING);
    setUserAnswer("");
    setFeedback('idle');
  };

  const handleHome = () => {
    if(window.confirm("Ana sayfaya dönmek istediğine emin misin? Tur sıfırlanacak.")) {
      setGameState(GameState.CHARACTER_SELECT);
      setLevel(1);
      setSelectedChar(null);
    }
  };

  const handleBack = () => {
    setGameState(GameState.CHARACTER_SELECT);
    // Don't reset level
  };

  const startNextLevel = () => {
    setLevel(prev => prev + 1);
    setGameState(GameState.CHARACTER_SELECT);
    setSelectedChar(null);
  };

  const checkAnswer = useCallback(async () => {
    if (!question) return;
    
    const val = parseInt(userAnswer);
    if (isNaN(val)) return;

    const isCorrect = val === question.answer;
    
    if (isCorrect) {
      setFeedback('correct');
      const newStats = {
        ...stats,
        score: stats.score + 10,
        correctAnswers: stats.correctAnswers + 1,
        totalQuestions: stats.totalQuestions + 1
      };
      setStats(newStats);

      setTimeout(async () => {
        if (newStats.totalQuestions >= MAX_QUESTIONS) {
          setLoadingMessage(true);
          setGameState(GameState.GAME_OVER);
          const msg = await getMagicalRewardMessage(selectedChar?.name || "Kahraman", newStats.score);
          setFinalMessage(msg);
          setLoadingMessage(false);
        } else {
          setQuestion(generateProblem());
          setUserAnswer("");
          setFeedback('idle');
        }
      }, 1500);
    } else {
      setFeedback('wrong');
      setTimeout(() => setFeedback('idle'), 1000);
    }
  }, [question, userAnswer, stats, selectedChar]);

  const handleNumpadClick = (num: number) => {
    if (userAnswer.length < 4) {
      setUserAnswer(prev => prev + num.toString());
    }
  };

  const handleBackspace = () => {
    setUserAnswer(prev => prev.slice(0, -1));
  };

  const currentStudent = getCurrentStudent();

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 font-body">
      <Background />
      
      {/* TOP NAVIGATION BAR */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-30 pointer-events-none">
         {/* Left Controls */}
         <div className="flex gap-3 pointer-events-auto">
            <NavButton 
              onClick={handleHome} 
              icon={<HomeIcon />} 
              label="Ana Sayfa" 
              colorClass="bg-red-600 border-red-800 hover:bg-red-500"
            />
            {gameState === GameState.PLAYING && (
              <NavButton 
                onClick={handleBack} 
                icon={<BackIcon />} 
                label="Geri" 
                colorClass="bg-slate-600 border-slate-800 hover:bg-slate-500"
              />
            )}
         </div>

         {/* Right/Center Info */}
         <div className="flex flex-col items-end gap-2">
             <div className="bg-black/30 backdrop-blur-md px-6 py-2 rounded-2xl border-2 border-yellow-400/50 shadow-lg">
                <span className="text-2xl font-magic text-yellow-300 drop-shadow-md">Tur: {level}</span>
             </div>
             
             {gameState === GameState.PLAYING && selectedChar && (
                <div className="flex items-center gap-3 bg-black/30 backdrop-blur-md px-4 py-2 rounded-2xl border-2 border-purple-400/50 shadow-lg">
                   <img src={selectedChar.imgUrl} alt="avatar" className="w-10 h-10 rounded-full border-2 border-yellow-300" />
                   <div className="flex flex-col items-end">
                      <span className="text-sm font-bold text-white">{selectedChar.name}</span>
                      <span className="text-lg font-magic text-yellow-200">Puan: {stats.score}</span>
                   </div>
                </div>
             )}
         </div>
      </div>

      {/* SCREEN 1: CHARACTER SELECT */}
      {gameState === GameState.CHARACTER_SELECT && (
        <div className="max-w-6xl w-full text-center z-10 mt-16">
          <h1 className="text-5xl md:text-7xl font-magic text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-500 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] mb-4 animate-float">
            Sihirli Matematik Krallığı
          </h1>
          
          <div className="inline-block bg-indigo-950/60 px-8 py-3 rounded-full border-2 border-indigo-400/30 mb-10 backdrop-blur-md shadow-[0_0_20px_rgba(79,70,229,0.3)]">
            <p className="text-2xl text-blue-100 font-bold">
              {level}. Tur Başlıyor - Kahramanını Seç!
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-4">
            {CHARACTERS.map(char => (
              <CharacterCard 
                key={char.id} 
                character={char} 
                onSelect={startGame} 
              />
            ))}
          </div>
        </div>
      )}

      {/* SCREEN 2: PLAYING */}
      {gameState === GameState.PLAYING && question && (
        <div className="w-full max-w-6xl z-10 flex flex-col gap-6 items-center justify-center mt-16">
          
          {/* Current Student Banner */}
          <div className="w-full max-w-2xl bg-gradient-to-r from-purple-900/80 via-indigo-900/80 to-purple-900/80 backdrop-blur-md p-4 rounded-full border-2 border-yellow-400/50 shadow-[0_0_30px_rgba(234,179,8,0.3)] text-center animate-float">
             <p className="text-yellow-200 font-magic text-xl md:text-3xl">
                Sıra Sende: <span className="text-white drop-shadow-lg">{currentStudent}</span>
             </p>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-start justify-center w-full">
            {/* Question Board */}
            <div className="bg-orange-50 rounded-[2.5rem] shadow-2xl overflow-hidden w-full md:w-1/2 max-w-md border-[10px] border-orange-900/40 relative group">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-10 pointer-events-none"></div>
              <div className="p-8 flex flex-col items-center justify-center min-h-[420px]">
                 
                 {/* Blackboard */}
                 <div className="bg-[#1a3c33] border-[8px] border-[#4a3627] rounded-xl p-6 w-full shadow-[inset_0_0_30px_rgba(0,0,0,0.8),0_10px_20px_rgba(0,0,0,0.3)] relative">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/dust.png')] opacity-20 pointer-events-none"></div>
                    
                    <div className="flex flex-col items-end text-white font-mono text-7xl tracking-widest space-y-4 mr-4 relative z-10">
                      <div className="text-right font-bold text-[#efefef] drop-shadow-md">{question.num1}</div>
                      <div className="flex items-center justify-end gap-6 w-full">
                        <span className="text-yellow-400 text-6xl absolute left-4">+</span>
                        <span className="font-bold text-[#efefef] drop-shadow-md">{question.num2}</span>
                      </div>
                      <div className="w-full h-2 bg-white/90 rounded-full my-4 shadow-lg"></div>
                      
                      {/* Answer Input Display */}
                      <div className={`h-24 w-full text-right pr-4 rounded-lg border-4 border-dashed flex items-center justify-end transition-colors duration-300 ${
                        feedback === 'correct' ? 'border-green-400 text-green-400 bg-green-900/30' : 
                        feedback === 'wrong' ? 'border-red-400 text-red-400 bg-red-900/30' : 'border-white/20 text-yellow-200 bg-black/20'
                      }`}>
                        {userAnswer}
                        <span className="animate-pulse ml-2 opacity-60 w-1 h-14 bg-yellow-200 inline-block rounded-full"></span>
                      </div>
                    </div>
                 </div>

                 {/* Helper Text */}
                 <div className="mt-6 text-center h-10">
                   <p className="font-bold text-2xl">
                     {feedback === 'correct' && <span className="text-green-600 drop-shadow-sm animate-bounce">✨ Harika! ✨</span>}
                     {feedback === 'wrong' && <span className="text-red-500 drop-shadow-sm animate-shake">Tekrar Dene!</span>}
                   </p>
                 </div>
              </div>
            </div>

            {/* Controls / Numpad */}
            <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[3rem] border border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.1)] w-full md:w-auto max-w-md">
               <div className="grid grid-cols-3 gap-4 mb-4">
                 {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                   <button 
                    key={num}
                    onClick={() => handleNumpadClick(num)}
                    className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl text-4xl font-bold text-indigo-900 shadow-[0_6px_0_rgb(79,70,229),0_10px_10px_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-1 hover:bg-indigo-50 hover:scale-105 transition-all"
                   >
                     {num}
                   </button>
                 ))}
                 <button 
                   onClick={handleBackspace}
                   className="w-16 h-16 md:w-20 md:h-20 bg-rose-100 rounded-2xl text-3xl font-bold text-rose-600 shadow-[0_6px_0_rgb(225,29,72),0_10px_10px_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-1 hover:bg-rose-200 hover:scale-105 transition-all flex items-center justify-center"
                 >
                   ⌫
                 </button>
                 <button 
                   onClick={() => handleNumpadClick(0)}
                   className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl text-4xl font-bold text-indigo-900 shadow-[0_6px_0_rgb(79,70,229),0_10px_10px_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-1 hover:bg-indigo-50 hover:scale-105 transition-all"
                 >
                   0
                 </button>
                 <button 
                   onClick={checkAnswer}
                   className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl text-4xl font-bold text-white shadow-[0_6px_0_rgb(6,95,70),0_10px_10px_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-1 hover:brightness-110 hover:scale-105 transition-all flex items-center justify-center"
                 >
                   ✓
                 </button>
               </div>
               <div className="text-center mt-6">
                  <div className="inline-block bg-indigo-950/50 rounded-full px-6 py-2 border border-indigo-500/30">
                      <span className="text-blue-200 font-magic text-xl tracking-wider">
                          Soru {stats.totalQuestions + 1} / {MAX_QUESTIONS}
                      </span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 3: GAME OVER / LEVEL COMPLETE */}
      {gameState === GameState.GAME_OVER && (
        <div className="max-w-3xl w-full bg-white/90 backdrop-blur-xl p-8 md:p-12 rounded-[3rem] text-center shadow-[0_0_100px_rgba(234,179,8,0.5)] border-8 border-yellow-400 z-50 relative overflow-hidden mx-4 mt-10 animate-float">
           <h2 className="text-6xl font-magic text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-6 drop-shadow-sm">
             {stats.score === MAX_QUESTIONS * 10 ? "Mükemmel!" : "Tebrikler!"}
           </h2>
           
           <div className="flex justify-center mb-8">
             <div className="relative group">
               <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-50 group-hover:opacity-80 transition-opacity"></div>
               <img src={selectedChar?.imgUrl} alt="winner" className="relative w-40 h-40 rounded-full border-8 border-yellow-400 shadow-2xl group-hover:scale-105 transition-transform object-cover" />
               <div className="absolute -top-4 -right-4 bg-yellow-400 text-yellow-900 w-14 h-14 rounded-full flex items-center justify-center font-bold text-3xl shadow-lg animate-bounce border-4 border-white">
                 ★
               </div>
             </div>
           </div>

           <div className="bg-indigo-50/80 p-8 rounded-3xl mb-8 border-4 border-indigo-100 shadow-inner">
              <div className="grid grid-cols-2 gap-8 mb-6 border-b-2 border-indigo-200 pb-6">
                  <div>
                      <p className="text-indigo-400 text-sm uppercase font-bold tracking-widest mb-1">Toplam Puan</p>
                      <p className="text-5xl font-bold text-purple-600 drop-shadow-sm">{stats.score}</p>
                  </div>
                  <div>
                      <p className="text-indigo-400 text-sm uppercase font-bold tracking-widest mb-1">Tamamlanan Tur</p>
                      <p className="text-5xl font-bold text-blue-600 drop-shadow-sm">{level}</p>
                  </div>
              </div>
              
              <h3 className="text-indigo-900 font-bold mb-3 text-xl">Bilge Büyücünün Mesajı:</h3>
              {loadingMessage ? (
                <div className="flex items-center justify-center gap-2 text-purple-500">
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              ) : (
                <p className="text-indigo-800 font-magic text-3xl leading-relaxed drop-shadow-sm">
                   "{finalMessage}"
                </p>
              )}
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Button 
               onClick={startNextLevel}
               variant="success"
               className="w-full text-xl py-5 shadow-[0_6px_0_rgb(21,128,61)] active:shadow-none active:translate-y-1 rounded-2xl"
             >
               Sıradaki Tur ({level + 1}. Tur)
             </Button>
             <Button 
               onClick={() => {
                   if(window.confirm("Ana sayfaya dönmek istediğine emin misin? Tur sayısı sıfırlanacak.")) {
                       setGameState(GameState.CHARACTER_SELECT);
                       setLevel(1);
                   }
               }}
               variant="secondary"
               className="w-full text-xl py-5 shadow-[0_6px_0_rgb(15,23,42)] active:shadow-none active:translate-y-1 rounded-2xl"
             >
               Ana Menü (Bitir)
             </Button>
           </div>
        </div>
      )}
    </div>
  );
}