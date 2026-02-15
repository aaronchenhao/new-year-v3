
import React, { useState, useEffect, useRef } from 'react';
import { ScanFace, Copy, Send, Trophy, X, Dice5, Sparkles, Music, Music2, Download, Image as ImageIcon, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { 
  HORSE_TYPES, 
  FATE_WORDS, 
  HORSE_RELAY_MESSAGES, 
  FORBIDDEN_BLESSINGS, 
  SENSITIVE_WORDS, 
  FORBIDDEN_WARNINGS, 
  SENSITIVE_WARNING,
  SYSTEM_ROAST_POOL,
  UNIVERSE_WEIRD_TALK_POOL,
  SHAKE_COMMENTS,
  filterSensitiveWords
} from './constants';
import { HorseType, FateWord, GameStep, MessagePool } from './types';
import { Button } from './components/Button';
import { HorseAvatar } from './components/HorseAvatars';

// Utility to get random item
const getRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Get matching roast based on horse type
const getMatchingRoast = (horseType: string): string => {

  // Create horse type specific filters
  const filters: Record<string, { include?: string[], exclude?: string[] }> = {
    '1': { // 純血牛馬
      include: ['工作', '壓力', '消耗', '工具人', '努力', '忙'],
      exclude: ['躺平', '擺爛', '摸魚', '糊弄', '輕鬆']
    },
    '2': { // 極品脆皮馬
      include: ['身體', '疲憊', '亞健康', '崩潰', '虛弱'],
      exclude: ['強壯', '精力充沛', '健康', '活力']
    },
    '3': { // 假裝在跑馬
      include: ['表演', '摸魚', '糊弄', '裝忙', '演戲'],
      exclude: ['努力', '專注', '認真', '真實']
    },
    '4': { // 被牽著走馬
      include: ['被安排', '工具人', '執行', '順從', '沒主見'],
      exclude: ['獨立', '反抗', '自主', '創新']
    },
    '5': { // 想逃沒草馬
      include: ['想逃', '沒錢', '窮', '無奈', '生存'],
      exclude: ['財務自由', '灑脫', '自由', '富有']
    },
    '6': { // 躺平心虛馬
      include: ['躺平', '擺爛', '焦慮', '矛盾', '妥協'],
      exclude: ['內卷', '奮鬥', '努力', '積極']
    },
    '7': { // 半退休馬
      include: ['看淡', '平和', '佛系', '退休', '養生'],
      exclude: ['內卷', '奮鬥', '努力', '卷王']
    },
    '8': { // 已讀不回馬
      include: ['沉默', '獨處', '冷漠', '自閉', '安靜'],
      exclude: ['熱情', '社交', '活躍', '健談']
    },
    '9': { // AI 邊緣馬
      include: ['科技', 'AI', '賽博', '焦慮', '邊緣'],
      exclude: ['傳統', '現實', '線下', '自然']
    },
    '10': { // 情緒外包馬
      include: ['情緒', '麻木', '玄學', '互聯網', '外包'],
      exclude: ['真實', '感受', '情緒豐富', '線下']
    },
    '11': { // 天生拽馬
      include: ['個性', '拒絕', '自我', '拽', '獨立'],
      exclude: ['順從', '妥協', '迎合', '隨波逐流']
    }
  };

  const filter = filters[horseType] || {};
  
  // Filter roasts
  const matchingRoasts = SYSTEM_ROAST_POOL.filter(roast => {
    // Check exclude words
    if (filter.exclude && filter.exclude.some(word => roast.includes(word))) {
      return false;
    }
    
    // Check include words (if specified)
    if (filter.include) {
      return filter.include.some(word => roast.includes(word));
    }
    
    // If no include words specified, include all
    return true;
  });

  // If no matching roasts found, return a random one
  if (matchingRoasts.length === 0) {
    return getRandom(SYSTEM_ROAST_POOL);
  }

  return getRandom(matchingRoasts);
};

// ID Generator for Badge
const generateBadgeId = () => {
  const prefixes = ['NO.996', 'NO.007', 'NO.886', 'NO.ICU', 'NO.CPU', 'NO.KPI', 'NO.PUA', 'NO.EMO'];
  const prefix = getRandom(prefixes);
  // Generate a suffix, e.g., 2026 or random 4 digits
  const suffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${suffix}`;
};

// --- AUDIO SYSTEM (Local 8-bit Synth) ---
class RetroBGM {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private tempo: number = 160; // Slightly slower for the bouncy festive feel
  private nextNoteTime: number = 0;
  private noteIndex: number = 0;
  private timerID: number | null = null;
  private isMuted: boolean = false;
  
  // Festive Chinese New Year Pentatonic Loop (Joyful)
  // Structure: Sol Sol La Sol | Do(hi) Do(hi) La Sol | Mi Mi Sol Mi | Re Re Do Do
  private melody = [
    392.00, 392.00, 440.00, 392.00, // G4 G4 A4 G4
    523.25, 523.25, 440.00, 392.00, // C5 C5 A4 G4
    329.63, 329.63, 392.00, 329.63, // E4 E4 G4 E4
    293.66, 293.66, 261.63, 261.63  // D4 D4 C4 C4
  ];

  constructor() {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContext();
    } catch (e) {
      console.error("Web Audio API not supported");
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isPlaying && this.ctx) {
       if (this.isMuted) {
         this.ctx.suspend();
       } else {
         this.ctx.resume();
       }
    }
    return this.isMuted;
  }

  setTempo(bpm: number) {
    this.tempo = bpm;
  }

  // New method for stamp sound effect
  playStamp() {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended' && !this.isMuted) this.ctx.resume();
    if (this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Low frequency thud
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);

    // Short, percussive envelope
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    osc.type = 'triangle'; // Triangle has a bit more body than sine for this
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  play() {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended' && !this.isMuted) this.ctx.resume();
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    this.noteIndex = 0;
    this.nextNoteTime = this.ctx.currentTime;
    this.scheduler();
  }

  stop() {
    this.isPlaying = false;
    if (this.timerID !== null) {
      window.clearTimeout(this.timerID);
      this.timerID = null;
    }
  }

  private scheduler() {
    if (!this.isPlaying || !this.ctx) return;
    while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
      if (!this.isMuted) {
        this.scheduleNote(this.nextNoteTime);
      }
      this.advanceNote();
    }
    this.timerID = window.setTimeout(() => this.scheduler(), 25);
  }

  private scheduleNote(time: number) {
    if (!this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Use triangle wave for a retro 8-bit game feel (NES style), sounds like a simple flute/pluck
    osc.type = 'triangle'; 
    
    const freq = this.melody[this.noteIndex % this.melody.length];
    osc.frequency.setValueAtTime(freq, time);

    // Staccato / Bouncy Envelope (Short and punchy)
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.1, time + 0.02); // Fast attack
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2); // Fast decay

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + 0.25); // Short note duration
  }

  private advanceNote() {
    const secondsPerBeat = 60.0 / this.tempo;
    this.nextNoteTime += 0.5 * secondsPerBeat; // 8th notes
    this.noteIndex++;
  }
}

// --- FLAT DECORATIVE COMPONENTS ---

const Lantern = ({ className = "", text = "福" }: { className?: string, text?: string }) => (
  <div className={`absolute z-0 pointer-events-none ${className} animate-sway`}>
    <div className="w-0.5 bg-[#4A2722] h-16 mx-auto opacity-50"></div>
    <div className="w-16 h-20 bg-[#FF0000] border-2 border-black rounded-2xl relative flex items-center justify-center pop-shadow">
      <div className="w-12 h-16 bg-[#D32F2F] rounded-xl flex items-center justify-center border border-black/10">
         <span className="text-[#FFD700] font-serif font-black text-2xl drop-shadow-md">{text}</span>
      </div>
      {/* Tassels */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-1">
         <div className="w-1 h-6 bg-[#FFD700] rounded-full border border-black/20"></div>
         <div className="w-1 h-8 bg-[#FFD700] rounded-full border border-black/20"></div>
         <div className="w-1 h-6 bg-[#FFD700] rounded-full border border-black/20"></div>
      </div>
    </div>
  </div>
);

const Particle = ({ style }: { style: React.CSSProperties }) => (
  <div className="absolute w-3 h-3 bg-[#FFD700] rounded-full animate-float opacity-60 blur-[1px]" style={style}></div>
);

const Couplet = ({ text, side }: { text: string, side: 'left' | 'right' }) => (
  <div className={`absolute top-24 ${side === 'left' ? 'left-2' : 'right-2'} w-10 md:w-12 bg-[#D32F2F] border-2 border-black rounded-full py-4 flex flex-col items-center gap-1 pop-shadow z-30 animate-float`} style={{ animationDelay: side === 'left' ? '0s' : '2s' }}>
    {text.split('').map((char, i) => (
      <span key={i} className="text-[#FFD700] font-serif font-black text-lg md:text-xl drop-shadow-sm">{char}</span>
    ))}
  </div>
);

// --- MAIN APP COMPONENT ---

export default function App() {
  const [step, setStep] = useState<GameStep>(GameStep.LANDING);
  const [myHorse, setMyHorse] = useState<HorseType | null>(null);
  const [myFate, setMyFate] = useState<FateWord | null>(null);
  const [username, setUsername] = useState<string>('');
  const [usernameError, setUsernameError] = useState<string>('');
  
  // State for random system roast suffix (only used in result page)
  const [randomSysRoast, setRandomSysRoast] = useState<string>('');
  
  // Shake State
  const [isShaking, setIsShaking] = useState(false);
  const [shakeComment, setShakeComment] = useState("");
  const [showFateResult, setShowFateResult] = useState(false);

  const [relayPool, setRelayPool] = useState<MessagePool>(HORSE_RELAY_MESSAGES);
  const [incomingMessage, setIncomingMessage] = useState<string>('');
  const [incomingMessageUsername, setIncomingMessageUsername] = useState<string>('');
  const [userRelayInput, setUserRelayInput] = useState('');
  // New state to track input source
  const [isFromRandomPool, setIsFromRandomPool] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [randomLandingTalk, setRandomLandingTalk] = useState('');
  const [marqueeTalk, setMarqueeTalk] = useState('');
  
  const [badgeId, setBadgeId] = useState('');

  const bgmRef = useRef<RetroBGM | null>(null);
  const [isBgmMuted, setIsBgmMuted] = useState(false);
  
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<{horseName: string, percentage: number, id: string}[]>([]);

  // Sharing & Poster Generation
  const [showShareModal, setShowShareModal] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const printerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRandomLandingTalk(getRandom(UNIVERSE_WEIRD_TALK_POOL));
    bgmRef.current = new RetroBGM();
    return () => {
      bgmRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (step === GameStep.SELECT_HORSE) {
      setMarqueeTalk(getRandom(UNIVERSE_WEIRD_TALK_POOL));
      const interval = setInterval(() => {
        setMarqueeTalk(getRandom(UNIVERSE_WEIRD_TALK_POOL));
      }, 3000);
      return () => clearInterval(interval);
    }
    
    // Play Stamp Sound and Generate ID when entering result screen
    if (step === GameStep.RESULT) {
       setBadgeId(generateBadgeId());
       // Small delay to match visual appearance or immediate
       setTimeout(() => {
         bgmRef.current?.playStamp();
       }, 300);
    }
  }, [step]);

  useEffect(() => {
    if (step === GameStep.RELAY && myHorse) {
      const fetchMessage = async () => {
        try {
          //const response = await fetch(`http://82.157.244.45:3001/api/messages/${myHorse.id}`);
          const response = await fetch(`/api/messages/${myHorse.id}`);
          const data = await response.json();
          if (data.success) {
            setIncomingMessage(data.message);
            setIncomingMessageUsername(data.username || '');
          } else {
            setIncomingMessage(data.message || "這是你的首條馬蹄印，沒人接你哦");
            setIncomingMessageUsername(data.username || '');
          }
        } catch (error) {
          console.error('獲取消息失敗:', error);
          setIncomingMessage("這是你的首條馬蹄印，沒人接你哦");
          setIncomingMessageUsername('');
        }
      };
      fetchMessage();
    }
  }, [step, myHorse]);

  useEffect(() => {
    if (isShaking) {
      bgmRef.current?.setTempo(260); // Very fast for shaking chaos
    } else {
      bgmRef.current?.setTempo(160); // Normal joyful festive tempo
    }
  }, [isShaking]);

  const toggleBGM = () => {
    if (bgmRef.current) {
      const muted = bgmRef.current.toggleMute();
      setIsBgmMuted(muted);
    }
  };

  const generateLeaderboard = async () => {
    try {
      // 調用後端API獲取真實數據
      const response = await fetch('/api/stats');
      const data = await response.json();
      
      if (data.success) {
        // 處理後端返回的數據
        const stats = HORSE_TYPES.map(h => ({
          ...h,
          count: parseInt(data.stats[h.id]) || 0
        }));
        
        // 計算總數
        const total = stats.reduce((acc, curr) => acc + curr.count, 0);
        
        // 計算百分比並排序
        const sorted = stats
          .map(s => ({
            horseName: s.name,
            id: s.id,
            percentage: total > 0 ? Math.round((s.count / total) * 100) : 0
          }))
          .sort((a, b) => b.percentage - a.percentage);
        
        // 取前5名
        setLeaderboardData(sorted.slice(0, 5));
      } else {
        // API失敗時使用降級方案
        useFallbackLeaderboard();
      }
    } catch (error) {
      console.error('獲取排行榜數據失敗:', error);
      // 網絡錯誤時使用降級方案
      useFallbackLeaderboard();
    }
  };

  // 降級方案：使用模擬數據
  const useFallbackLeaderboard = () => {
    const stats = HORSE_TYPES.map(h => ({
      ...h,
      count: Math.floor(Math.random() * 500) + 50 
    }));
    if (myHorse) {
      const target = stats.find(s => s.id === myHorse.id);
      if (target) target.count += 1;
    }
    const total = stats.reduce((acc, curr) => acc + curr.count, 0);
    const sorted = stats.map(s => ({
      horseName: s.name,
      id: s.id,
      percentage: Math.round((s.count / total) * 100)
    })).sort((a, b) => b.percentage - a.percentage);
    setLeaderboardData(sorted.slice(0, 5));
  };

  const handleStart = () => {
    bgmRef.current?.play();
    setStep(GameStep.USERNAME_INPUT);
  };

  const handleUsernameSubmit = () => {
    if (!username.trim()) {
      setUsernameError("怎麼也得整個牛馬代號吧？");
      return;
    }
    if (username.length < 1) {
      setUsernameError("牛馬代號太短了，至少1個字！");
      return;
    }
    if (username.length > 12) {
      setUsernameError("牛馬代號太長了，最多12個字！");
      return;
    }
    
    // 過濾敏感詞
    const filteredUsername = filterSensitiveWords(username);
    if (filteredUsername !== username) {
      // 更新為過濾後的用戶名
      setUsername(filteredUsername);
    }
    
    setUsernameError('');
    setStep(GameStep.SELECT_HORSE);
  };

  const handleSelectHorse = (horse: HorseType) => {
    setMyHorse(horse);
    setTimeout(() => setStep(GameStep.DRAW_FATE), 300);
  };

  const handleStartShake = () => {
    if (isShaking) return;
    setIsShaking(true);
    setShowFateResult(false);
    setShakeComment(getRandom(SHAKE_COMMENTS));

    // Shake sequence
    let count = 0;
    const interval = setInterval(() => {
       count++;
       if (count % 3 === 0) {
          setShakeComment(getRandom(SHAKE_COMMENTS));
       }
       if (count >= 15) { // 3 seconds approx (15 * 200ms)
          clearInterval(interval);
          
          const randomFate = getRandom(FATE_WORDS);
          setMyFate(randomFate);
          
          // Select a matching system roast based on horse type
          setRandomSysRoast(getMatchingRoast(myHorse?.id || '1'));
          
          setIsShaking(false);
          setShowFateResult(true);
       }
    }, 200);
  };

  const handleRelaySubmit = async () => {
    if (!userRelayInput.trim()) {
      setErrorMsg("怎麼也得哼哼兩句吧？");
      return;
    }
    
    // Only perform forbidden blessings checks if the input is MANUALLY typed (not from random pool)
    if (!isFromRandomPool) {
      const hasBlessing = FORBIDDEN_BLESSINGS.some(word => userRelayInput.includes(word));
      if (hasBlessing) {
        setErrorMsg(getRandom(FORBIDDEN_WARNINGS));
        return;
      }
    }
    
    // 過濾敏感詞
    const filteredContent = filterSensitiveWords(userRelayInput);
    const filteredUsername = filterSensitiveWords(username);
    
    try {
      // 提交消息到後端
      //const response = await fetch(`http://82.157.244.45:3001/api/messages/${myHorse?.id}`, {
        const response = await fetch(`/api/messages/${myHorse?.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: filteredContent, username: filteredUsername }),
      });
      
      const data = await response.json();
      if (data.success) {
        setToastMessage("🎉 傳遞成功");
        setToastType("success");
        setShowToast(true);
        
        setTimeout(async () => {
          bgmRef.current?.stop();
          setShowToast(false);
          if (Math.random() > 0.6) {
            await generateLeaderboard();
            setShowLeaderboard(true);
          } else {
            setStep(GameStep.RESULT);
          }
        }, 1200);
      } else {
        setErrorMsg(data.message || "訊息傳遞失敗，請重試");
      }
    } catch (error) {
      console.error('提交消息失敗:', error);
      setErrorMsg("網路錯誤，請重試");
    }
  };

  // Image Generation Logic
  const handleGeneratePosters = async () => {
    if (!printerRef.current) return;
    setIsGenerating(true);
    setShowShareModal(true);
    setGeneratedImages([]); // Clear previous

    try {
      const scenes = printerRef.current.querySelectorAll('.print-scene');
      const images: string[] = [];

      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i] as HTMLElement;
        const canvas = await html2canvas(scene, {
          backgroundColor: '#8B0000', // Explicit fallback background color
          scale: 1.5, // Reduced scale for better mobile performance
          logging: false,
          useCORS: true,
          allowTaint: true,
          removeContainer: false,
          width: 375,
          height: 667,
          scrollX: 0,
          scrollY: 0,
          // 增加配置項以改善渲染效果
          letterRendering: true,
          useForeignObjectForSVG: false
        });
        images.push(canvas.toDataURL('image/png'));
      }
      setGeneratedImages(images);
    } catch (err) {
      console.error('生成圖片失敗:', err);
      setToastMessage("生成失敗，請重試");
      setToastType("error");
      setShowToast(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderLanding = () => (
    <div className="flex-1 w-full h-full flex flex-col items-center justify-center relative overflow-hidden px-4 pt-20 pb-8">
      {/* Top Decor */}
      <div className="absolute top-4 w-full flex justify-between px-8 pointer-events-none z-0">
          <Lantern className="relative transform -rotate-6" text="牛" />
          <Lantern className="relative transform rotate-6 scale-90" text="馬" />
      </div>

      {[...Array(6)].map((_, i) => (
        <Particle key={i} style={{ top: `${Math.random()*100}%`, left: `${Math.random()*100}%`, animationDelay: `${i*0.5}s` }} />
      ))}

      {/* Main Title Area */}
      <div className="relative w-full max-w-xs bg-[#FFFDF7] rounded-[2rem] pop-shadow border-4 border-black p-6 flex flex-col items-center text-center space-y-4 animate-pop z-10 mt-4">
        
        <div className="space-y-1">
           <h2 className="text-xs font-black text-[#8B0000] tracking-widest bg-[#FFD700] border-2 border-black px-3 py-1 rounded-full inline-block transform -rotate-2">2026 馬年限定</h2>
           <h1 className="text-5xl font-black text-[#9B1C1C] leading-none drop-shadow-sm">
             牛馬<br/>宇宙
           </h1>
        </div>

        {/* Avatar Section */}
        <div className="relative w-32 h-32 mt-2">
           {/* Glow */}
           <div className="absolute inset-0 bg-[#FFD700] rounded-full opacity-30 animate-pulse blur-xl"></div>
           <HorseAvatar id="11" expressionOverride="rolling_eyes" className="w-full h-full transform hover:scale-105 transition-transform drop-shadow-md relative z-10" />
        </div>

        <p className="text-sm font-black text-[#8B0000] opacity-80">
           🧧 今年不拜年，只鑑馬
        </p>
      </div>

      {/* Button Area */}
      <div className="z-10 w-full max-w-xs space-y-4 mt-8">
        <Button onClick={handleStart} className="w-full shadow-xl border-2 border-black" variant="primary">
          🚪 敲門進入
        </Button>
      </div>
    </div>
  );

  const renderUsernameInput = () => (
    <div className="flex-1 w-full h-full flex flex-col items-center justify-center relative overflow-hidden px-4 pt-20 pb-8">
      {/* Top Decor */}
      <div className="absolute top-4 w-full flex justify-between px-8 pointer-events-none z-0">
          <Lantern className="relative transform -rotate-6" text="牛" />
          <Lantern className="relative transform rotate-6 scale-90" text="馬" />
      </div>

      {[...Array(6)].map((_, i) => (
        <Particle key={i} style={{ top: `${Math.random()*100}%`, left: `${Math.random()*100}%`, animationDelay: `${i*0.5}s` }} />
      ))}

      {/* Main Input Area */}
      <div className="relative w-full max-w-xs bg-[#FFFDF7] rounded-[2rem] pop-shadow border-4 border-black p-6 flex flex-col items-center text-center space-y-6 animate-pop z-10 mt-4">
        
        <div className="space-y-2">
           <h2 className="text-xs font-black text-[#8B0000] tracking-widest bg-[#FFD700] border-2 border-black px-3 py-1 rounded-full inline-block transform -rotate-2">牛馬登記處</h2>
           <h1 className="text-4xl font-black text-[#9B1C1C] leading-none drop-shadow-sm">
             請輸入<br/>牛馬代號
           </h1>
        </div>

        {/* Input Section */}
        <div className="w-full space-y-4">
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setUsernameError('');
              }}
              placeholder="請輸入你的牛馬代號"
              maxLength={12}
              className="w-full p-4 text-lg border-2 border-black rounded-2xl bg-white placeholder-[#D7CCC8] text-[#4A2722] focus:outline-none focus:ring-4 focus:ring-[#FFD700] shadow-inner"
            />
            <div className="absolute right-4 bottom-4 text-xs font-bold text-[#A1887F]">
              {username.length}/12
            </div>
          </div>
          
          {usernameError && (
            <div className="bg-[#D32F2F] text-white p-2 rounded-xl font-bold text-sm text-center animate-pop border-2 border-black">
              {usernameError}
            </div>
          )}
          
          <p className="text-xs font-black text-[#8B0000] opacity-70 text-left">
            🐂 牛馬代號將作為你在牛馬宇宙的身份標識<br/>
            🐎 長度1-12字，越牛馬越好
          </p>
        </div>
      </div>

      {/* Button Area */}
      <div className="z-10 w-full max-w-xs space-y-4 mt-8">
        <Button onClick={handleUsernameSubmit} className="w-full shadow-xl border-2 border-black" variant="primary">
          🐎 確認代號
        </Button>
      </div>
    </div>
  );

  const renderSelectHorse = () => (
    <div className="flex flex-col h-full w-full relative">
      <header className="text-center py-6 sticky top-0 z-20 shrink-0 bg-gradient-to-b from-[#8B0000] to-transparent">
        <h2 className="text-2xl font-black text-[#FFD700] drop-shadow-md text-stroke">Step 1: 認領你的品種</h2>
        <div className="mt-2 inline-block bg-white/10 backdrop-blur-md rounded-full px-4 py-1 border border-[#FFD700]/30">
          <div className="text-xs text-[#FFD700] font-bold whitespace-nowrap animate-soft-pulse">
            📢 宇宙廣播: {marqueeTalk}
          </div>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto px-4 pb-24 w-full space-y-4 no-scrollbar">
        {HORSE_TYPES.map((horse, idx) => (
          <button
            key={horse.id}
            onClick={() => handleSelectHorse(horse)}
            className="w-full bg-[#FFFDF7] p-4 rounded-3xl text-left hover:scale-[1.02] transition-all pop-shadow border-2 border-black flex items-center gap-4 group relative overflow-hidden"
            style={{ animation: `pop-in 0.5s ease-out ${idx * 0.1}s forwards`, opacity: 0 }}
          >
            <div className="w-16 h-16 bg-[#FFEEEE] rounded-2xl flex items-center justify-center shrink-0 border border-black/10">
              <HorseAvatar id={horse.id} className="w-12 h-12" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black text-[#9B1C1C] mb-1">{horse.name}</h3>
              <p className="text-xs text-[#5D4037] font-bold leading-tight opacity-90">{horse.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderFate = () => {
    if (!showFateResult && !isShaking) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center px-6 w-full animate-pop relative">
           <div className="bg-[#FFFDF7] p-8 rounded-[2.5rem] w-full max-w-xs pop-shadow border-4 border-black flex flex-col items-center text-center relative z-10">
               <div className="w-36 h-36 mb-6 bg-[#FFD700]/20 rounded-full flex items-center justify-center p-2 border-2 border-[#FFD700] border-dashed overflow-hidden">
                  <HorseAvatar id={myHorse?.id || '1'} className="w-32 h-32" />
               </div>
               <h2 className="text-2xl font-black text-[#9B1C1C] mb-2">{myHorse?.name}</h2>
               <p className="text-sm text-[#4A2722] mb-8 font-bold">準備好面對你的 2026 命運了嗎？</p>
               
               <Button onClick={handleStartShake} variant="primary" fullWidth className="text-xl border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                  👋 搖一搖求籤
               </Button>
           </div>
        </div>
      );
    }

    if (isShaking) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center w-full relative overflow-hidden">
          <div className="absolute top-24 left-0 right-0 text-center z-20">
             <span className="bg-white border-2 border-black px-6 py-3 rounded-full text-[#9B1C1C] font-black text-lg pop-shadow animate-pop rotate-2">
                {shakeComment}
             </span>
          </div>
          <div className="z-10 animate-shake-hard w-64 h-64 relative mt-10">
             <svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
                 <path d="M40,60 L40,200 Q40,230 100,230 Q160,230 160,200 L160,60" fill="#B71C1C" stroke="black" strokeWidth="3" />
                 <ellipse cx="100" cy="60" rx="60" ry="20" fill="#8B0000" stroke="black" strokeWidth="3" />
                 <g className="animate-sway" style={{ transformOrigin: '100px 60px' }}>
                    <rect x="90" y="10" width="10" height="80" fill="#FFD700" stroke="black" strokeWidth="2" rx="2" transform="rotate(-15 100 60)" />
                    <rect x="110" y="20" width="10" height="70" fill="#FFD700" stroke="black" strokeWidth="2" rx="2" transform="rotate(10 100 60)" />
                    <rect x="80" y="25" width="10" height="60" fill="#FFC107" stroke="black" strokeWidth="2" rx="2" transform="rotate(-5 100 60)" />
                    <rect x="105" y="5" width="10" height="85" fill="#FFC107" stroke="black" strokeWidth="2" rx="2" transform="rotate(2 100 60)" />
                 </g>
                 <path d="M40,60 L40,200 Q40,230 100,230 Q160,230 160,200 L160,60" fill="#FF0000" stroke="black" strokeWidth="3" />
                 <path d="M50,70 Q50,210 50,210" stroke="white" strokeWidth="8" strokeLinecap="round" opacity="0.3" />
                 <path d="M40,60 Q40,80 100,80 Q160,80 160,60" fill="#D32F2F" stroke="black" strokeWidth="3" />
                 <rect x="70" y="90" width="60" height="70" fill="#FFD700" stroke="black" strokeWidth="3" rx="4" transform="rotate(-2 100 125)" />
                 <text x="100" y="135" textAnchor="middle" fill="#B71C1C" fontSize="40" fontWeight="bold" fontFamily="serif" transform="rotate(-2 100 125)">籤</text>
             </svg>
          </div>
          <div className="mt-12 text-[#FFD700] font-black text-2xl animate-pulse drop-shadow-md text-stroke">
             正在搖出你的馬生...
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 w-full">
        <div className="bg-[#FFFDF7] p-0 rounded-[2rem] pop-shadow border-4 border-black max-w-sm w-full animate-pop relative overflow-hidden flex flex-col">
          <div className="bg-[#FFD700] p-4 text-center border-b-4 border-black">
            <h3 className="text-[#9B1C1C] font-black text-xl tracking-widest">✨ 年度一字 ✨</h3>
          </div>
          
          <div className="p-6 text-center flex flex-col items-center">
             <div className="text-[9rem] font-black text-[#9B1C1C] leading-none mb-6 drop-shadow-md animate-drop-in">
                {myFate?.word}
             </div>
             
             <div className="w-full bg-[#FFF0F0] border-2 border-[#9B1C1C]/20 rounded-2xl p-5 text-left space-y-4 animate-pop" style={{ animationDelay: '0.5s', opacity: 0, animationFillMode: 'forwards' }}>
                 <div className="flex gap-3">
                    <span className="bg-[#4A2722] text-[#FFD700] text-xs font-bold px-2 py-1 rounded-md h-fit whitespace-nowrap">古籍云</span>
                    <p className="text-sm font-serif text-[#4A2722] opacity-80">{myFate?.old_meaning}</p>
                 </div>
                 
                 <div className="flex gap-3">
                    <span className="bg-[#D32F2F] text-white text-xs font-bold px-2 py-1 rounded-md h-fit whitespace-nowrap">人話</span>
                    <p className="text-base font-bold text-[#9B1C1C]">{myFate?.modern_meaning}</p>
                 </div>

                 <div className="w-full h-[2px] bg-[#4A2722]/10 border-t border-dashed border-[#4A2722]/30"></div>

                 <div className="flex gap-3 items-start">
                    <span className="text-2xl leading-none pt-1">🌚</span>
                    <div className="flex flex-col">
                        <span className="text-xs bg-[#D32F2F] text-white px-1.5 py-0.5 rounded w-fit mb-1 font-bold">系統銳評</span>
                        <p className="text-sm font-bold text-[#4A2722] italic leading-relaxed text-left">{myFate?.roast}</p>
                    </div>
                 </div>
             </div>
             
             <Button onClick={() => setStep(GameStep.RELAY)} fullWidth variant="primary" className="mt-6 border-2 border-black">
               就這樣吧 (下一步)
             </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderRelay = () => (
    <div className="flex flex-col h-full px-4 pt-10 pb-8 max-w-md mx-auto w-full">
      <div className="flex-1 flex flex-col justify-center space-y-6">
        <div className="relative">
           <div className="absolute -top-3 left-4 bg-[#D32F2F] text-white px-3 py-1 text-xs font-bold rounded-full z-10 shadow-sm border border-black">
              📬 來自上一匹{myHorse?.name}的祝福
           </div>
           <div className="bg-[#FFFDF7] p-6 rounded-[2rem] pop-shadow border-4 border-black font-bold text-lg text-[#9B1C1C] relative">
              “{incomingMessage}”
              {incomingMessageUsername && (
                <div className="mt-2 text-xs font-bold text-[#A1887F] flex items-center justify-end gap-1">
                  <span>🐎</span>
                  <span>來自[{incomingMessageUsername}]的祝福</span>
                </div>
              )}
           </div>
        </div>

        <div className="bg-white/20 backdrop-blur-md p-4 rounded-[2rem] border-2 border-[#FFD700]/50 space-y-4">
          <label className="block text-[#FFD700] font-black text-xl mb-2 flex items-center gap-2 pl-2 drop-shadow-md">
            <Send className="w-5 h-5"/> 留下馬蹄印
          </label>
          
          <div className="relative">
             <textarea
              rows={3}
              maxLength={isFromRandomPool ? 200 : 30}
              value={userRelayInput}
              onChange={(e) => { 
                setUserRelayInput(e.target.value); 
                setErrorMsg(''); 
                setIsFromRandomPool(false); // Mark as manually typed
              }}
              placeholder="最多30字..."
              className={`w-full p-4 text-lg border-2 border-black rounded-2xl bg-[#FFFDF7] placeholder-[#D7CCC8] text-[#4A2722] focus:outline-none focus:ring-4 focus:ring-[#FFD700] shadow-inner resize-none`}
            />
            {!isFromRandomPool && (
              <div className="absolute right-4 bottom-4 text-xs font-bold text-[#A1887F]">
                {userRelayInput.length}/30
              </div>
            )}
          </div>
          
          <div className="w-full">
            <button 
              onClick={() => { 
                if (myHorse) {
                   const specificMessages = relayPool[myHorse.id] || UNIVERSE_WEIRD_TALK_POOL;
                   const candidates = specificMessages.filter(m => m !== incomingMessage);
                   const pool = candidates.length > 0 ? candidates : specificMessages;
                   const randomMsg = getRandom(pool);
                   setUserRelayInput(randomMsg); 
                   setErrorMsg(''); 
                   setIsFromRandomPool(true);
                }
              }}
              className="w-full bg-[#DCD3FF] hover:bg-[#C5B3FF] text-[#4A2722] font-bold rounded-2xl border-2 border-black flex items-center justify-center gap-2 active:scale-95 pop-shadow py-3"
            >
               <Dice5 className="w-5 h-5" /> 隨機整一句
            </button>
          </div>

          {errorMsg && (
            <div className="bg-[#D32F2F] text-white p-2 rounded-xl font-bold text-sm text-center animate-pop border-2 border-black">
              {errorMsg}
            </div>
          )}
        </div>
      </div>
      
      <Button onClick={handleRelaySubmit} fullWidth variant="primary" className="mt-4 border-2 border-black">
        🚀 扔進宇宙
      </Button>
    </div>
  );

  const renderResult = () => (
    <div className="flex flex-col h-full w-full items-center p-4 relative overflow-hidden">
       {/* Background Couplets - Aligned at top-24 */}
       <Couplet text="摸魚劃水技藝高" side="left" />
       <Couplet text="帶薪拉屎身體棒" side="right" />

       {/* Main Content Container - Flex space-between to manage gaps */}
       <div className="flex-1 w-full z-10 relative flex flex-col items-center h-full pt-20 pb-4">
         
         {/* Top Section: Badge + QR Code */}
         <div className="flex-1 w-full flex flex-col items-center justify-start gap-4">
             {/* Badge Container */}
             <div className="relative w-full max-w-[260px]">
                 {/* Lanyard - Fixed to top of card */}
                 <div className="absolute -top-[140px] left-1/2 -translate-x-1/2 z-0 w-32 h-64 pointer-events-none">
                    <svg viewBox="0 0 100 200" className="w-full h-full drop-shadow-lg">
                        <path d="M40,0 L40,150 Q40,180 50,180 Q60,180 60,150 L60,0" fill="#D32F2F" stroke="#8B0000" strokeWidth="2" />
                        <rect x="35" y="145" width="30" height="10" rx="2" fill="#C0C0C0" stroke="#666" strokeWidth="1" />
                    </svg>
                 </div>

                 {/* Work Badge Card - Compact Header */}
                 <div className="w-full bg-[#FFFDF7] rounded-[2rem] border-4 border-black pop-shadow relative z-10 flex flex-col animate-pop">
                     {/* Hole */}
                     <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-4 bg-[#DDD] rounded-full border-2 border-black/10 z-0"></div>

                     {/* Compact Header (Reduced height from h-24 to h-20) */}
                     <div className="bg-[#D32F2F] h-20 w-full border-b-4 border-black relative rounded-t-[1.7rem] overflow-hidden">
                         <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 12px)' }}></div>
                     </div>

                     {/* Avatar - Moved up to overlap more (top-8 instead of top-10) */}
                     <div className="absolute top-8 left-1/2 -translate-x-1/2 w-24 h-24 bg-[#FFF] rounded-full border-4 border-black flex items-center justify-center z-20 shadow-lg overflow-hidden">
                        <HorseAvatar id={myHorse?.id || '1'} className="w-20 h-20" />
                     </div>

                     {/* Content Body - Compact spacing */}
                     <div className="pt-12 pb-5 px-5 flex flex-col items-center text-center relative">
                         <div className="mb-1 bg-[#FFD700] border-2 border-black px-3 py-0.5 rounded-full text-[10px] font-black text-[#4A2722] transform -rotate-2">
                            神馬 · 2026
                         </div>
                         <h1 className="text-2xl font-black text-[#9B1C1C] mb-1 relative z-10">
                            {myHorse?.name}
                         </h1>
                         {/* Stamp */}
                         <div className="absolute top-2 right-2 transform rotate-[15deg] opacity-90 pointer-events-none z-0 animate-pop" style={{ animationDelay: '0.2s' }}>
                            <div className="w-16 h-16 border-4 border-[#D32F2F] rounded-full flex items-center justify-center p-1 mask-image">
                                <div className="w-full h-full border-2 border-[#D32F2F] rounded-full flex items-center justify-center border-dashed">
                                    <span className="text-[#D32F2F] font-black text-xs leading-tight rotate-[-15deg]">牛馬&lt;br/&gt;認證</span>
                                </div>
                            </div>
                         </div>
                         
                         <div className="text-xs font-bold text-[#5D4037] mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#22C55E] border border-black"></span>
                            牛馬代號：{username}
                         </div>
                         <div className="text-xs font-bold text-[#5D4037] mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#22C55E] border border-black"></span>
                            狀態：{myFate?.word}着
                         </div>
                         
                         {/* System Roast - Combined */}
                         <div className="w-full bg-[#FFF0F0] border-2 border-[#D32F2F] rounded-xl p-2 relative group mb-1">
                            <div className="absolute -top-3 left-4 bg-[#D32F2F] text-white text-[10px] px-2 py-0.5 rounded border border-black">
                                系統銳評
                            </div>
                            <div className="text-xs font-bold text-[#4A2722] mt-1 leading-relaxed text-left">
                                {myFate?.roast}
                                <br/>
                                <span className="text-[#9B1C1C] opacity-80 mt-1 block font-normal">PS: {randomSysRoast}</span>
                            </div>
                         </div>
                         
                         <div className="mt-4 w-full flex justify-between items-end opacity-60">
                            <div className="flex flex-col gap-1">
                                <div className="w-12 h-2 bg-black"></div>
                                <div className="w-8 h-1 bg-black"></div>
                            </div>
                            <span className="font-mono text-xs font-bold text-[#9B1C1C] tracking-tight">{badgeId}</span>
                         </div>
                     </div>
                 </div>
             </div>

             {/* Logo Section - Flexible margin to space evenly */}
             <div className="my-auto bg-white p-2 rounded-xl border-2 border-black shadow-lg animate-pop" style={{animationDelay: '0.3s'}}>
                 <img src="/logo.png" alt="Logo" className="w-16 h-16 opacity-90" />
             </div>
         </div>

         {/* Bottom Section: Buttons */}
         <div className="w-full max-w-[300px] space-y-3 z-20 shrink-0">
           <Button onClick={handleGeneratePosters} fullWidth variant="primary" className="border-2 border-black shadow-[4px_4px_0px_#000]">
               <ImageIcon className="w-5 h-5" /> 複製發圈
           </Button>
           <Button onClick={() => {
               setStep(GameStep.LANDING); 
               setMyFate(null); 
               setMyHorse(null); 
               setUsername('');
               setUsernameError('');
               setUserRelayInput('');
               setIsShaking(false);
               setShowFateResult(false);
               setRandomSysRoast('');
             }} fullWidth variant="secondary" className="border-2 border-black shadow-[4px_4px_0px_#000]">
             <X className="w-5 h-5" /> 重新投胎
           </Button>
         </div>

       </div>
    </div>
  );

  const renderLeaderboard = () => (
    <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-pop">
      <div className="w-full max-w-sm bg-[#FFFDF7] rounded-[2rem] border-4 border-black pop-shadow p-6 relative overflow-hidden flex flex-col max-h-[80vh]">
        <div className="absolute top-0 left-0 w-full h-4 bg-[#FFD700] border-b-2 border-black"></div>
        <button 
          onClick={() => { setShowLeaderboard(false); setStep(GameStep.RESULT); }}
          className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-full transition-colors z-10"
        >
          <X className="w-6 h-6 text-[#4A2722]" />
        </button>
        
        <h3 className="text-2xl font-black text-[#9B1C1C] text-center mb-6 mt-4 flex items-center justify-center gap-2">
           <Trophy className="w-8 h-8 text-[#FFD700] drop-shadow-md fill-[#FFD700] stroke-black" /> 
           <span>摸魚排行榜</span>
        </h3>
        
        <div className="flex-1 overflow-y-auto space-y-3 px-1 no-scrollbar pb-4">
           {leaderboardData.map((item, index) => (
             <div key={index} className="flex items-center gap-3 bg-white p-3 rounded-xl border-2 border-black shadow-sm transform hover:scale-[1.02] transition-transform">
                <div className={`w-8 h-8 flex items-center justify-center rounded-full font-black text-white border-2 border-black shadow-sm ${index < 3 ? 'bg-[#FFD700] text-[#4A2722]' : 'bg-[#A1887F]'}`}>
                   {index + 1}
                </div>
                <div className="w-10 h-10 bg-[#FFEEEE] rounded-lg border border-black/10 flex items-center justify-center shrink-0">
                   <HorseAvatar id={item.id} className="w-8 h-8" />
                </div>
                <div className="flex-1 min-w-0">
                   <div className="font-bold text-[#4A2722] truncate">{item.horseName}</div>
                   <div className="w-full bg-[#EFEFEF] h-3 rounded-full mt-1 overflow-hidden border border-black/10 relative">
                      <div className="h-full bg-[#FF6B6B] relative" style={{ width: `${Math.max(item.percentage, 5)}%` }}>
                          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      </div>
                   </div>
                </div>
                <div className="font-mono font-bold text-[#9B1C1C] text-sm whitespace-nowrap">{item.percentage}%</div>
             </div>
           ))}
        </div>
        
        <div className="mt-4 pt-4 border-t-2 border-dashed border-[#4A2722]/20 text-center shrink-0">
           <p className="text-xs font-bold text-[#A1887F] mb-3">僅展示前 5 名最能摸魚的品種</p>
           <Button onClick={() => { setShowLeaderboard(false); setStep(GameStep.RESULT); }} fullWidth variant="primary" className="border-2 border-black py-3 text-base shadow-[4px_4px_0px_#000]">
             查看我的結果
           </Button>
        </div>
      </div>
    </div>
  );

  const renderShareModal = () => {
    if (!showShareModal) return null;

    return (
      <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-pop">
        <button 
          onClick={() => setShowShareModal(false)}
          className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors z-50"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        {isGenerating ? (
          <div className="text-center text-white space-y-4">
             <Loader2 className="w-12 h-12 animate-spin mx-auto text-[#FFD700]" />
             <p className="font-bold text-lg">正在生成牛馬護身符...</p>
          </div>
        ) : (
          <div className="w-full max-w-md h-full flex flex-col items-center">
             <h3 className="text-[#FFD700] font-black text-xl mb-4 text-center shrink-0">
               長按保存图片，发圈防身
             </h3>
             
             <div className="flex-1 w-full overflow-y-auto overflow-x-hidden space-y-6 px-4 pb-20 no-scrollbar touch-pan-y">
                {generatedImages.map((img, idx) => (
                  <div key={idx} className="relative w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-[#4A2722] transform transition-transform hover:scale-[1.02]">
                     <img src={img} alt={`Poster ${idx}`} className="w-full h-auto block" />
                     <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm pointer-events-none">
                       {idx === 0 ? '封面' : idx === 1 ? '真言' : '工牌'}
                     </div>
                  </div>
                ))}
             </div>
             
             <div className="absolute bottom-6 left-0 right-0 px-6 pointer-events-none flex justify-center">
                 <div className="bg-[#4A2722]/80 backdrop-blur-md text-[#FFD700] px-4 py-2 rounded-full text-xs font-bold border border-[#FFD700]/30 shadow-lg animate-pulse pointer-events-auto">
                    長按圖片保存到相冊
                 </div>
             </div>
          </div>
        )}
      </div>
    );
  };

  // --- HIDDEN PRINTER FOR POSTER GENERATION ---
  // Renders distinct, separate scenes for html2canvas
  // Each scene is a fixed 375x667 container to simulate a perfect mobile screenshot
  const renderHiddenPrinter = () => {
    // Parent container is hidden but layout is crucial
    const printerWrapperStyle: React.CSSProperties = {
       position: 'fixed', 
       left: '-9999px', 
       top: 0, 
       display: 'flex',
       flexDirection: 'column',
       gap: '20px',
       zIndex: -1,
       // Do not use overflow hidden here or it clips the children for html2canvas
    };

    // Shared scene style: fixed size, relative positioning for absolute children
    const sceneStyle: React.CSSProperties = {
       width: '375px',
       height: '667px',
       position: 'relative',
       // Simplified background for better mobile compatibility
       background: '#8B0000',
       display: 'flex',
       flexDirection: 'column',
       alignItems: 'center',
       justifyContent: 'center',
       padding: '2rem',
       boxSizing: 'border-box',
       border: '8px solid #8B0000',
       overflow: 'hidden' // Clip overflowing elements like lanterns
    };

    return (
      <div ref={printerRef} style={printerWrapperStyle}>
         
         {/* Single Scene: Combined Poster */}
         <div className="print-scene" style={sceneStyle}>
             {/* Couplets positions manually */}
             <div style={{position: 'absolute', top: '5rem', left: '1rem'}}><Couplet text="摸魚劃水技藝高" side="left" /></div>
             <div style={{position: 'absolute', top: '5rem', right: '1rem'}}><Couplet text="帶薪拉屎身體棒" side="right" /></div>
             
             {/* Combined Poster */}
             <div className="w-[280px] bg-[#FFFDF7] rounded-[2rem] border-4 border-black relative z-10 flex flex-col mt-4 shadow-xl">
                 <div className="bg-[#D32F2F] h-20 w-full border-b-4 border-black relative rounded-t-[1.7rem] overflow-hidden"></div>
                 
                 {/* Avatar */}
                 <div style={{
                   position: 'absolute',
                   top: '32px',
                   left: '50%',
                   marginLeft: '-48px',
                   width: '96px',
                   height: '96px',
                   backgroundColor: '#FFF',
                   borderRadius: '50%',
                   border: '4px solid black',
                   overflow: 'hidden',
                   zIndex: 20,
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center'
                 }}>
                    <img
                      src={`/horse-avatars/${myHorse?.id || '1'}.png`}
                      alt={`Horse ${myHorse?.id || '1'}`}
                      style={{
                        width: '80%',
                        height: '80%',
                        display: 'block',
                        objectFit: 'cover'
                      }}
                    />
                 </div>
                 
                 {/* Content Body */}
                 <div className="pt-16 pb-6 px-6 flex flex-col items-center text-center">
                     <div className="mb-2 bg-[#FFD700] border-2 border-black px-4 py-2 rounded-full text-xs font-black text-[#4A2722] flex items-center justify-center min-h-[32px]">
                       <span style={{lineHeight: '1'}}>神馬 · 2026</span>
                     </div>
                     
                     {/* Horse Type */}
                     <h1 className="text-3xl font-black text-[#9B1C1C] mb-4">{myHorse?.name}</h1>
                     
                     {/* Fate Word */}
                     <div className="bg-[#FFEEEE] rounded-full px-8 py-3 mb-4 border-2 border-[#FFD700] flex items-center justify-center min-h-[40px]">
                       <span className="text-2xl font-black text-[#9B1C1C]" style={{lineHeight: '1'}}>{myFate?.word || '命'}</span>
                     </div>
                     
                     {/* Info */}
                     <div className="w-full space-y-2 mb-4">
                       <div className="text-sm font-bold text-[#5D4037]">牛馬代號：{username}</div>
                       <div className="text-sm font-bold text-[#5D4037]">狀態：{myFate?.word}着</div>
                     </div>
                     
                     {/* System Roast */}
                     <div className="w-full bg-[#FFF0F0] border-2 border-[#D32F2F] rounded-xl p-3 relative text-left mb-4">
                        <p className="text-xs font-bold text-[#4A2722]">{myFate?.roast}</p>
                        <p className="text-xs font-normal text-[#9B1C1C] mt-1 opacity-80">PS: {randomSysRoast}</p>
                     </div>
                     
                     {/* Badge ID */}
                     <div className="mt-2 font-mono text-sm font-bold text-[#9B1C1C] opacity-60">{badgeId}</div>
                 </div>
             </div>
             
             {/* QR Code */}
             <div className="mt-4 bg-white p-2 rounded-xl border-2 border-black z-20">
                 <img src="/logo.png" className="w-20 h-20" />
             </div>
         </div>
      </div>
    );
  };

  return (
    <div className="w-full h-[100dvh] md:h-[850px] md:max-h-[95vh] md:max-w-[480px] relative shadow-2xl overflow-hidden flex flex-col md:rounded-[3rem] bg-gradient-to-b from-[#8B0000] to-[#FF6B6B] transition-all font-sans ring-8 ring-white/20 bg-horse-pattern">
      
      <button 
        onClick={toggleBGM}
        className="absolute top-6 right-6 z-50 bg-black/20 backdrop-blur-md text-white p-2 rounded-full hover:bg-black/40 transition-all border border-white/20"
      >
        <HorseMusicIcon muted={isBgmMuted} className={`w-5 h-5 ${isBgmMuted ? 'opacity-70' : 'animate-pulse'}`} />
      </button>

      <main className="flex-1 h-full overflow-hidden relative flex flex-col">
        {step === GameStep.LANDING && renderLanding()}
        {step === GameStep.USERNAME_INPUT && renderUsernameInput()}
        {step === GameStep.SELECT_HORSE && renderSelectHorse()}
        {step === GameStep.DRAW_FATE && renderFate()}
        {step === GameStep.RELAY && renderRelay()}
        {step === GameStep.RESULT && renderResult()}
      </main>

      {showLeaderboard && renderLeaderboard()}
      {showShareModal && renderShareModal()}
      {renderHiddenPrinter()}

      {showToast && (
          <div className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-6 py-3 rounded-full z-[70] animate-pop font-bold text-center shadow-lg border-2 border-black ${toastType === 'success' ? 'bg-[#FFD700] text-[#4A2722]' : 'bg-[#4A2722] text-white'}`}>
              {toastMessage}
          </div>
      )}
    </div>
  );
}

function HorseMusicIcon({className, muted}: {className?: string, muted?: boolean}) {
   return (
     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
       {/* Head */}
       <path d="M7 8c0 5-1 9 5 9s5-4 5-9c0-3-2-4-5-4s-5 1-5 4z" />
       {/* Ears */}
       <path d="M7 6L6 2L10 4" />
       <path d="M17 6L18 2L14 4" />
       {/* Face details */}
       <circle cx="10" cy="9" r="1" fill="currentColor" />
       <circle cx="14" cy="9" r="1" fill="currentColor" />
       <path d="M10 13c1 1 3 1 4 0" />
       {muted && <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="2" />}
     </svg>
   )
}
