import React, { useEffect, useRef, useState } from 'react';
import { GameEngine, GameState, UpgradeOption, CHARACTERS, Character } from './game/Engine';
import { Heart, Zap, Shield, FastForward, Droplet, ArrowRight, Maximize, RotateCw, Wind, Coffee, Pickaxe, Cone, PieChart, RotateCcw, Pause, Play, CircleDollarSign, Plus, Check, Volume2, VolumeX, Trophy, Loader2 } from 'lucide-react';

const daveImg = 'https://res.cloudinary.com/dhc60qvv3/image/upload/v1772965522/Dave_the_miner_akwikr.png';
const bigKevImg = 'https://res.cloudinary.com/dhc60qvv3/image/upload/v1772965523/big_kev_cyuxkl.png';
const kevImg = 'https://res.cloudinary.com/dhc60qvv3/image/upload/v1772965523/Kev_pqjaue.png';
const shazzaImg = 'https://res.cloudinary.com/dhc60qvv3/image/upload/v1772965523/Shazza_the_camp_cook_wm3uby.png';
const steveImg = 'https://res.cloudinary.com/dhc60qvv3/image/upload/v1772965618/steve_the_safety_officer_zssekj.png';
const dashBg = 'https://res.cloudinary.com/dhc60qvv3/image/upload/v1772968885/dashbackground_ajglxu.png';
const prop1 = 'https://res.cloudinary.com/dhc60qvv3/image/upload/v1772968885/prop1_xxwq96.png';
const prop2 = 'https://res.cloudinary.com/dhc60qvv3/image/upload/v1772968888/prop2_hzro4w.png';
const prop3 = 'https://res.cloudinary.com/dhc60qvv3/image/upload/v1772968889/prop3_rkhheg.png';
const gemStatusIcon = 'https://res.cloudinary.com/dhc60qvv3/image/upload/v1773018790/diamond_cl74ut.png';
const pieIcon = 'https://res.cloudinary.com/dhc60qvv3/image/upload/v1773018791/pie_xns3v6.png';
const pickIcon = 'https://res.cloudinary.com/dhc60qvv3/image/upload/v1773029911/pick_s5igm2.png';

const iconMap: Record<string, React.ReactNode> = {
  'pickaxe': <img src={pickIcon} alt="Pickaxe" className="w-6 h-6 object-contain drop-shadow-md" />,
  'cone': <img src={prop2} alt="Cone" className="w-6 h-6 object-contain drop-shadow-md" />,
  'pie': <img src={prop3} alt="Pie" className="w-6 h-6 object-contain drop-shadow-md" />,
  'zap': <Zap className="w-8 h-8 text-yellow-400" />,
  'maximize': <Maximize className="w-8 h-8 text-purple-400" />,
  'wind': <Wind className="w-8 h-8 text-teal-400" />,
  'heart': <Heart className="w-8 h-8 text-red-400" />,
};

interface CustomCharacter {
  id: string;
  name: string;
  url: string;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const lastClickTime = useRef<number>(0);
  const lastClickedChar = useRef<string | null>(null);

  const [gameState, setGameState] = useState<GameState>('menu');
  const [stats, setStats] = useState({ hp: 100, maxHp: 100, level: 1, xp: 0, xpToNext: 30, time: 0, gems: 0, pies: 0 });
  const [upgrades, setUpgrades] = useState<UpgradeOption[]>([]);

  const [characters, setCharacters] = useState<Character[]>(CHARACTERS);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(CHARACTERS[0].id);
  const [isBgmEnabled, setIsBgmEnabled] = useState(true);
  const [bgmVolume, setBgmVolume] = useState(0.5);

  // Leaderboard state
  const [playerName, setPlayerName] = useState('');
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch (e) {
      console.error("Failed to fetch leaderboard", e);
    }
  };

  const submitScore = async () => {
    if (!playerName.trim()) return;
    setIsSubmittingScore(true);
    try {
      // Calculate a score based on level, gems, and time survived
      const score = (stats.level * 1000) + (stats.gems * 10) + Math.floor(stats.time * 5);
      
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: playerName.trim(),
          score: score,
          characterId: selectedCharacterId
        })
      });
      
      if (res.ok) {
        setScoreSubmitted(true);
        fetchLeaderboard();
        setShowLeaderboard(true);
      }
    } catch (e) {
      console.error("Failed to submit score", e);
    } finally {
      setIsSubmittingScore(false);
    }
  };

  useEffect(() => {
    if (gameState === 'menu') {
      fetchLeaderboard();
    }
  }, [gameState]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current, {
      onStateChange: setGameState,
      onStatsChange: setStats,
      onLevelUp: setUpgrades,
    });
    engineRef.current = engine;

    const handleFirstInteraction = () => {
      engine.playBGM();
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      engine.destroy();
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  const startGame = (id?: string | React.MouseEvent) => {
    const charId = typeof id === 'string' ? id : selectedCharacterId;
    setScoreSubmitted(false);
    setShowLeaderboard(false);
    engineRef.current?.selectCharacter(charId);
    engineRef.current?.start(charId);
  };

  const selectUpgrade = (id: string) => {
    engineRef.current?.applyUpgrade(id);
  };

  const handleAddCharacter = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const newChar: Character = { 
        id: Date.now().toString(), 
        name: `Miner ${characters.length}`, 
        img: url,
        description: 'A custom miner.',
        stats: { hp: 100, speed: 200, damageMultiplier: 1 },
        startingBuff: '',
        specialSkill: ''
      };
      setCharacters(prev => [...prev, newChar]);
      setSelectedCharacterId(newChar.id);
      // We need to tell the engine about this new character image
      engineRef.current?.addCustomCharacter(newChar);
    }
  };

  const toggleBgm = () => {
    if (engineRef.current) {
      const enabled = engineRef.current.toggleBGM();
      setIsBgmEnabled(enabled);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    setBgmVolume(volume);
    if (engineRef.current) {
      engineRef.current.setBGMVolume(volume);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black font-sans select-none">
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* HUD */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <div className="absolute top-0 left-0 w-full p-1 md:p-4 pointer-events-none z-50">
          {/* Desktop HUD */}
          <div className="hidden md:flex justify-between items-start w-full">
            <div className="flex items-center gap-4">
              <div className="relative flex items-center">
                <div className="bg-gradient-to-b from-[#8B5A43] to-[#5C3A21] border-4 border-[#2D1A11] rounded-r-xl rounded-l-none pl-12 pr-6 py-2 ml-10 flex flex-col justify-center h-16 shadow-lg relative">
                  <span className="text-[#F4D0A4] font-bold text-xl leading-tight uppercase tracking-wide" style={{ WebkitTextStroke: '1px #2D1A11' }}>
                    {characters.find(c => c.id === selectedCharacterId)?.name || 'Davo'}
                  </span>
                  <div className="w-32 h-4 bg-[#4A2F1D] rounded-sm border-2 border-[#1A0F09] mt-1 relative overflow-hidden">
                    <div className="h-full bg-[#e74c3c]" style={{ width: `${(stats.hp / stats.maxHp) * 100}%` }} />
                  </div>
                </div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-20 h-20 bg-[#5C3A21] rounded-full border-4 border-[#2D1A11] overflow-hidden flex items-center justify-center shadow-lg z-10">
                  <img src={characters.find(c => c.id === selectedCharacterId)?.img} alt="Character" className="w-full h-full object-contain bg-[#4A4A4A]" />
                </div>
              </div>
              <div className="flex items-center bg-gradient-to-b from-[#8B5A43] to-[#5C3A21] border-4 border-[#2D1A11] rounded-xl px-4 h-12 shadow-lg">
                <img src={gemStatusIcon} alt="Gems" className="w-8 h-8 object-contain mr-2 drop-shadow-md" />
                <span className="text-[#F4D0A4] font-bold text-xl" style={{ WebkitTextStroke: '1px #2D1A11' }}>{stats.gems}</span>
              </div>
            </div>
            <div className="flex-1 max-w-lg mx-4">
              <div className="w-full h-10 bg-[#4A2F1D] rounded-xl border-4 border-[#2D1A11] relative overflow-hidden shadow-lg flex items-center p-1">
                <div className="h-full bg-[#f1c40f] rounded-sm transition-all duration-200" style={{ width: `${(stats.xp / stats.xpToNext) * 100}%` }} />
                <div className="absolute inset-0 flex items-center justify-center text-[#F4D0A4] font-bold drop-shadow-md uppercase tracking-wide" style={{ WebkitTextStroke: '1px #2D1A11' }}>
                  LVL {stats.level} - {stats.xp} / {stats.xpToNext}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-gradient-to-b from-[#8B5A43] to-[#5C3A21] border-4 border-[#2D1A11] rounded-xl px-3 h-12 shadow-lg gap-2">
                <button 
                  onClick={toggleBgm}
                  className="flex items-center justify-center pointer-events-auto hover:scale-110 transition-transform"
                >
                  {isBgmEnabled ? <Volume2 className="w-6 h-6 text-[#F4D0A4]" /> : <VolumeX className="w-6 h-6 text-[#F4D0A4]" />}
                </button>
                <input 
                  type="range" min="0" max="1" step="0.01" 
                  value={bgmVolume} 
                  onChange={handleVolumeChange}
                  className="w-24 accent-[#F4D0A4] cursor-pointer pointer-events-auto"
                />
              </div>
              <div className="flex items-center bg-gradient-to-b from-[#8B5A43] to-[#5C3A21] border-4 border-[#2D1A11] rounded-xl px-4 h-12 shadow-lg">
                <img src={pieIcon} alt="Pies" className="w-8 h-8 object-contain mr-1 drop-shadow-md" />
                <span className="text-[#F4D0A4] font-bold text-xl" style={{ WebkitTextStroke: '1px #2D1A11' }}>{stats.pies}</span>
              </div>
              <button onClick={() => startGame()} className="w-12 h-12 bg-gradient-to-b from-[#8B5A43] to-[#5C3A21] border-4 border-[#2D1A11] rounded-xl flex items-center justify-center pointer-events-auto hover:from-[#9C6A53] hover:to-[#6C4A31] shadow-lg">
                <RotateCcw className="w-6 h-6 text-[#F4D0A4]" />
              </button>
              <button onClick={() => engineRef.current?.togglePause()} className="w-12 h-12 bg-gradient-to-b from-[#8B5A43] to-[#5C3A21] border-4 border-[#2D1A11] rounded-xl flex items-center justify-center pointer-events-auto hover:from-[#9C6A53] hover:to-[#6C4A31] shadow-lg">
                {gameState === 'paused' ? <Play className="w-6 h-6 text-[#F4D0A4] fill-[#F4D0A4]" /> : <Pause className="w-6 h-6 text-[#F4D0A4] fill-[#F4D0A4]" />}
              </button>
            </div>
          </div>

          {/* Mobile HUD (Redesigned) */}
          <div className="flex md:hidden flex-col w-full px-2 pt-1 gap-1">
            <div className="flex items-center justify-between w-full gap-2">
              {/* Portrait & HP */}
              <div className="flex items-center">
                <div className="relative w-14 h-14 bg-[#5C3A21] rounded-full border-2 border-[#2D1A11] overflow-hidden shadow-lg">
                  <img src={characters.find(c => c.id === selectedCharacterId)?.img} alt="Char" className="w-full h-full object-contain" />
                </div>
                <div className="ml-1.5 w-24 h-3.5 bg-[#4A2F1D] rounded-full border-2 border-[#1A0F09] overflow-hidden shadow-inner">
                  <div className="h-full bg-[#e74c3c]" style={{ width: `${(stats.hp / stats.maxHp) * 100}%` }} />
                </div>
              </div>
              
              {/* XP Bar */}
              <div className="flex-1 h-7 bg-[#4A2F1D] rounded-full border-2 border-[#2D1A11] relative overflow-hidden shadow-inner">
                <div className="h-full bg-[#f1c40f]" style={{ width: `${(stats.xp / stats.xpToNext) * 100}%` }} />
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#F4D0A4] uppercase tracking-wider" style={{ WebkitTextStroke: '0.5px #2D1A11' }}>
                  LVL {stats.level}
                </div>
              </div>

              {/* Pause Button */}
              <button 
                onClick={() => engineRef.current?.togglePause()}
                className="w-10 h-10 bg-gradient-to-b from-[#8B5A43] to-[#5C3A21] border-2 border-[#2D1A11] rounded-lg flex items-center justify-center pointer-events-auto shadow-lg active:scale-90 transition-transform"
              >
                {gameState === 'paused' ? <Play className="w-5 h-5 text-[#F4D0A4] fill-[#F4D0A4]" /> : <Pause className="w-5 h-5 text-[#F4D0A4] fill-[#F4D0A4]" />}
              </button>
            </div>

            {/* Volume Control Row Mobile */}
            <div className="flex items-center justify-end gap-2 px-1">
              <div className="flex items-center bg-black/40 rounded-full px-2 py-1 border border-[#F4D0A4]/20 gap-2">
                <button onClick={toggleBgm} className="pointer-events-auto">
                  {isBgmEnabled ? <Volume2 className="w-4 h-4 text-[#F4D0A4]" /> : <VolumeX className="w-4 h-4 text-[#F4D0A4]" />}
                </button>
                <input 
                  type="range" min="0" max="1" step="0.01" 
                  value={bgmVolume} 
                  onChange={handleVolumeChange}
                  className="w-20 h-1 accent-[#F4D0A4] cursor-pointer pointer-events-auto"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paused Overlay */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-40 pointer-events-none">
          <div className="text-center">
            <h2 className="text-6xl font-black text-[#F4D0A4] uppercase tracking-widest mb-4" style={{ WebkitTextStroke: '2px #2D1A11', textShadow: '0 8px 16px rgba(0,0,0,0.8)' }}>
              PAUSED
            </h2>
          </div>
        </div>
      )}

      {/* Main Menu */}
      {gameState === 'menu' && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-between z-50 bg-cover bg-center py-12 px-4 bg-[#b34d36]"
          style={{ backgroundImage: `url(${dashBg})` }}
        >
          {/* Top Section: Title & Subtitle */}
          <div className="flex flex-col items-center mt-8">
            {/* Title Plate */}
            <div className="relative bg-gradient-to-b from-[#8B5A43] to-[#5C3A21] border-4 border-[#2D1A11] rounded-xl px-12 py-4 shadow-[0_10px_20px_rgba(0,0,0,0.6)] mb-6">
              {/* Rivets */}
              <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-[#4A2F1D] border-2 border-[#1A0F09] shadow-inner"></div>
              <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-[#4A2F1D] border-2 border-[#1A0F09] shadow-inner"></div>
              <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-[#4A2F1D] border-2 border-[#1A0F09] shadow-inner"></div>
              <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-[#4A2F1D] border-2 border-[#1A0F09] shadow-inner"></div>
              
              <h1 className="text-5xl md:text-7xl font-black text-[#F4D0A4] tracking-wider uppercase" style={{ WebkitTextStroke: '2px #2D1A11', textShadow: '0 4px 4px rgba(0,0,0,0.5)' }}>
                FIFO SURVIVOR
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-white font-bold text-center max-w-3xl" style={{ WebkitTextStroke: '1px black', textShadow: '0 2px 4px black' }}>
              Survive the outback horde. Use WASD or Arrow Keys to move. Auto-attack.
            </p>
          </div>

          {/* Middle Section: Character Selection */}
          <div className="w-full max-w-5xl flex flex-col items-center">
            {/* Select Miner Header Plate */}
            <div className="relative bg-gradient-to-b from-[#8B5A43] to-[#5C3A21] border-4 border-[#2D1A11] rounded-lg px-6 py-2 shadow-lg mb-6 self-start ml-4 md:ml-12">
              {/* Rivets */}
              <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 rounded-full bg-[#4A2F1D] border-2 border-[#1A0F09] shadow-inner"></div>
              <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#4A2F1D] border-2 border-[#1A0F09] shadow-inner"></div>
              <div className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 rounded-full bg-[#4A2F1D] border-2 border-[#1A0F09] shadow-inner"></div>
              <div className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#4A2F1D] border-2 border-[#1A0F09] shadow-inner"></div>
              
              <h3 className="text-[#F4D0A4] font-bold text-xl md:text-2xl uppercase tracking-wide" style={{ WebkitTextStroke: '1px #2D1A11' }}>
                Select Your Miner
              </h3>
            </div>

            {/* Character Cards */}
            <div className="flex gap-6 overflow-x-auto pb-8 pt-4 snap-x snap-mandatory items-start custom-scrollbar px-4 md:px-12 max-w-full">
              {characters.map(char => (
                <div key={char.id} className="flex flex-col items-center gap-3 flex-shrink-0 snap-center">
                  <div 
                    onClick={() => {
                      const now = Date.now();
                      if (lastClickedChar.current === char.id && now - lastClickTime.current < 400) {
                        setSelectedCharacterId(char.id);
                        startGame(char.id);
                      } else {
                        setSelectedCharacterId(char.id);
                        lastClickedChar.current = char.id;
                        lastClickTime.current = now;
                      }
                    }}
                    className={`relative w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 cursor-pointer transition-all overflow-hidden bg-[#4A4A4A] flex items-center justify-center shadow-[0_8px_16px_rgba(0,0,0,0.5)] ${
                      selectedCharacterId === char.id ? 'border-[#F4D0A4] scale-110 shadow-[0_0_25px_rgba(244,208,164,0.6)]' : 'border-[#2D1A11] hover:border-[#8B5A43]'
                    }`}
                  >
                    <img src={char.img} alt={char.name} className="w-full h-full object-contain p-2" />
                    {selectedCharacterId === char.id && (
                      <div className="absolute bottom-0 left-0 w-full bg-[#2D1A11]/80 py-1 text-center">
                        <span className="text-[10px] text-[#F4D0A4] font-bold uppercase">Selected</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[#F4D0A4] text-sm md:text-base font-bold uppercase text-center w-32 md:w-40 leading-tight" style={{ WebkitTextStroke: '1px #2D1A11', textShadow: '0 2px 2px black' }}>
                    {char.name}
                  </span>
                  <div className="flex gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-red-500" />
                      <span className="text-[10px] text-white font-bold">{char.stats.hp}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-yellow-500" />
                      <span className="text-[10px] text-white font-bold">x{char.stats.damageMultiplier}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Wind className="w-3 h-3 text-teal-500" />
                      <span className="text-[10px] text-white font-bold">{char.stats.speed}</span>
                    </div>
                  </div>
                  {char.startingBuff && (
                    <div className="text-[9px] md:text-[10px] text-[#A3E635] text-center w-32 md:w-40 leading-tight mt-1 font-mono">
                      {char.startingBuff}
                    </div>
                  )}
                  {char.specialSkill && (
                    <div className="text-[9px] md:text-[10px] text-[#FCD34D] text-center w-32 md:w-40 leading-tight mt-1 font-mono">
                      {char.specialSkill}
                    </div>
                  )}
                </div>
              ))}
              
              <div className="flex flex-col items-center gap-3 flex-shrink-0 snap-center">
                <label className="w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 border-dashed border-[#2D1A11] cursor-pointer hover:bg-[#5C3A21] bg-[#4A4A4A]/80 transition-colors flex flex-col items-center justify-center pointer-events-auto shadow-[0_8px_16px_rgba(0,0,0,0.5)]">
                  <Plus className="w-10 h-10 text-[#F4D0A4] mb-2" />
                  <span className="text-[#F4D0A4] text-xs md:text-sm font-bold uppercase" style={{ WebkitTextStroke: '1px #2D1A11' }}>Add New</span>
                  <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleAddCharacter} />
                </label>
              </div>
            </div>
          </div>

          {/* Bottom Section: Start Button */}
          <div className="flex flex-col md:flex-row gap-4 mt-auto mb-8 items-center z-10">
            <button 
              onClick={() => setShowLeaderboard(true)}
              className="relative group px-8 py-4 bg-gradient-to-b from-[#3498db] to-[#2980b9] hover:from-[#5dade2] hover:to-[#3498db] border-4 border-[#2D1A11] rounded-xl transition-all shadow-[0_10px_20px_rgba(0,0,0,0.6)] hover:scale-105 pointer-events-auto active:scale-95 flex items-center gap-3 h-full"
            >
              <Trophy className="w-8 h-8 text-yellow-400 drop-shadow-md" />
              <span className="text-2xl font-black text-[#F4D0A4] tracking-widest uppercase" style={{ WebkitTextStroke: '1px #2D1A11', textShadow: '0 4px 4px rgba(0,0,0,0.5)' }}>
                TOP MINERS
              </span>
            </button>

            <button 
              onClick={() => startGame()}
              className="relative group px-16 py-4 bg-gradient-to-b from-[#8B5A43] to-[#5C3A21] hover:from-[#9C6A50] hover:to-[#6B3A20] border-4 border-[#2D1A11] rounded-xl transition-all shadow-[0_10px_20px_rgba(0,0,0,0.6)] hover:scale-105 pointer-events-auto active:scale-95"
            >
              {/* Rivets */}
              <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-[#4A2F1D] border-2 border-[#1A0F09] shadow-inner"></div>
              <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-[#4A2F1D] border-2 border-[#1A0F09] shadow-inner"></div>
              <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-[#4A2F1D] border-2 border-[#1A0F09] shadow-inner"></div>
              <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-[#4A2F1D] border-2 border-[#1A0F09] shadow-inner"></div>
              
              <span className="text-4xl font-black text-[#F4D0A4] tracking-widest uppercase" style={{ WebkitTextStroke: '1.5px #2D1A11', textShadow: '0 4px 4px rgba(0,0,0,0.5)' }}>
                START SHIFT
              </span>
            </button>
          </div>

          {/* Credits & Site Link */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto z-[100]">
            <a 
              href="https://fifos.life" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#F4D0A4] font-black text-[16px] md:text-lg hover:text-white transition-colors uppercase tracking-[0.3em] leading-none"
              style={{ WebkitTextStroke: '0.5px #2D1A11', textShadow: '0 2px 4px black' }}
            >
              FIFOS.LIFE
            </a>
            <div className="flex items-center gap-1 text-[#F4D0A4] font-bold text-[12px] md:text-[11px] uppercase tracking-wider" style={{ WebkitTextStroke: '0.3px #2D1A11', textShadow: '0 1px 2px black' }}>
              <span>By</span>
              <a 
                href="https://www.linkedin.com/in/botaoshen/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-white transition-colors underline decoration-[#F4D0A4]"
              >
                Botao Shen
              </a>
            </div>
          </div>

          {/* Menu Volume Control */}
          <div className="absolute top-4 right-4 flex items-center bg-black/40 rounded-full px-3 py-2 border border-[#F4D0A4]/20 gap-2 pointer-events-auto z-[100]">
            <button onClick={toggleBgm} className="hover:scale-110 transition-transform">
              {isBgmEnabled ? <Volume2 className="w-5 h-5 text-[#F4D0A4]" /> : <VolumeX className="w-5 h-5 text-[#F4D0A4]" />}
            </button>
            <input 
              type="range" min="0" max="1" step="0.01" 
              value={bgmVolume} 
              onChange={handleVolumeChange}
              className="w-20 md:w-32 h-1 accent-[#F4D0A4] cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      {gameState === 'menu' && showLeaderboard && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-[200] p-4">
          <div className="relative bg-gradient-to-b from-[#8B5A43] to-[#5C3A21] p-6 md:p-8 rounded-2xl border-4 border-[#2D1A11] max-w-lg w-full shadow-[0_10px_20px_rgba(0,0,0,0.6)] flex flex-col max-h-[80vh]">
            <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-[#4A2F1D] border-2 border-[#1A0F09] shadow-inner"></div>
            <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-[#4A2F1D] border-2 border-[#1A0F09] shadow-inner"></div>
            <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-[#4A2F1D] border-2 border-[#1A0F09] shadow-inner"></div>
            <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-[#4A2F1D] border-2 border-[#1A0F09] shadow-inner"></div>

            <div className="flex justify-between items-center mb-6 border-b-4 border-[#2D1A11] pb-4">
              <h2 className="text-3xl md:text-4xl font-black text-[#F4D0A4] uppercase tracking-widest flex items-center gap-3" style={{ WebkitTextStroke: '1.5px #2D1A11', textShadow: '0 4px 4px rgba(0,0,0,0.5)' }}>
                <Trophy className="w-8 h-8 text-yellow-400 drop-shadow-md" />
                TOP MINERS
              </h2>
              <button 
                onClick={() => setShowLeaderboard(false)}
                className="w-10 h-10 bg-[#e74c3c] hover:bg-[#ff6b6b] border-2 border-[#2D1A11] rounded-lg flex items-center justify-center text-white font-black shadow-lg transition-colors pointer-events-auto"
              >
                X
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3 pointer-events-auto">
              {leaderboard.length === 0 ? (
                <div className="text-[#F4D0A4] text-center font-bold py-8 opacity-70">
                  No scores recorded yet. Be the first!
                </div>
              ) : (
                leaderboard.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between bg-[#3A2215] p-3 md:p-4 rounded-xl border-2 border-[#1A0F09] shadow-inner">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className={`w-8 h-8 flex items-center justify-center rounded-full border-2 border-[#1A0F09] font-black text-sm ${
                        index === 0 ? 'bg-yellow-400 text-[#2D1A11]' : 
                        index === 1 ? 'bg-gray-300 text-[#2D1A11]' : 
                        index === 2 ? 'bg-amber-600 text-white' : 
                        'bg-[#4A2F1D] text-[#F4D0A4]'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[#F4D0A4] font-black text-base md:text-lg uppercase tracking-wider" style={{ WebkitTextStroke: '0.5px #1A0F09' }}>
                          {entry.name}
                        </span>
                        <span className="text-[#A88A72] text-xs font-bold">
                          {characters.find(c => c.id === entry.characterId)?.name || 'Unknown Miner'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[#2ecc71] font-black text-xl md:text-2xl" style={{ WebkitTextStroke: '1px #1A0F09' }}>
                      {entry.score.toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Level Up */}
      {gameState === 'levelup' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-50 overflow-y-auto py-8">
          <div className="max-w-4xl w-full p-4 md:p-8">
            <div className="relative bg-gradient-to-b from-[#8B5A43] to-[#5C3A21] border-4 border-[#2D1A11] rounded-xl px-8 md:px-12 py-3 md:py-4 shadow-[0_10px_20px_rgba(0,0,0,0.6)] mb-6 md:mb-8 mx-auto w-max">
              <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-[#4A2F1D] border-2 border-[#1A0F09] shadow-inner"></div>
              <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-[#4A2F1D] border-2 border-[#1A0F09] shadow-inner"></div>
              <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-[#4A2F1D] border-2 border-[#1A0F09] shadow-inner"></div>
              <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-[#4A2F1D] border-2 border-[#1A0F09] shadow-inner"></div>
              <h2 className="text-2xl md:text-4xl font-black text-center text-[#F4D0A4] drop-shadow-lg uppercase tracking-widest" style={{ WebkitTextStroke: '1.5px #2D1A11', textShadow: '0 4px 4px rgba(0,0,0,0.5)' }}>
                Level Up!
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {upgrades.map((u) => (
                <button
                  key={u.id}
                  onClick={() => selectUpgrade(u.id)}
                  className="relative bg-gradient-to-b from-[#8B5A43] to-[#5C3A21] hover:from-[#9C6A50] hover:to-[#6B3A20] border-4 border-[#2D1A11] hover:border-[#F4D0A4] p-4 md:p-6 rounded-2xl flex flex-row md:flex-col items-center text-left md:text-center transition-all transform hover:scale-105 group pointer-events-auto shadow-[0_8px_16px_rgba(0,0,0,0.5)]"
                >
                  <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-[#4A2F1D] border border-[#1A0F09] shadow-inner"></div>
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#4A2F1D] border border-[#1A0F09] shadow-inner"></div>
                  <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-[#4A2F1D] border border-[#1A0F09] shadow-inner"></div>
                  <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-[#4A2F1D] border border-[#1A0F09] shadow-inner"></div>

                  <div className="mr-4 md:mr-0 md:mb-4 p-3 md:p-4 bg-[#4A2F1D] border-2 border-[#2D1A11] rounded-full group-hover:bg-[#5C3A21] transition-colors flex-shrink-0">
                    {iconMap[u.icon] || <Zap className="w-6 h-6 md:w-8 md:h-8 text-[#F4D0A4]" />}
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-lg md:text-xl font-bold text-[#F4D0A4] mb-1 md:mb-2 uppercase tracking-wide" style={{ WebkitTextStroke: '1px #2D1A11' }}>{u.title}</h3>
                    <p className="text-[#F4D0A4] text-xs md:text-sm font-bold opacity-90">{u.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Game Over */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50 p-4">
          <div className="relative bg-gradient-to-b from-[#8B5A43] to-[#5C3A21] p-6 md:p-8 rounded-2xl border-4 border-[#2D1A11] text-center max-w-md w-full shadow-[0_10px_20px_rgba(0,0,0,0.6)]">
            <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-[#4A2F1D] border-2 border-[#1A0F09] shadow-inner"></div>
            <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-[#4A2F1D] border-2 border-[#1A0F09] shadow-inner"></div>
            <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-[#4A2F1D] border-2 border-[#1A0F09] shadow-inner"></div>
            <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-[#4A2F1D] border-2 border-[#1A0F09] shadow-inner"></div>

            <h2 className="text-4xl md:text-5xl font-black text-[#e74c3c] mb-2 uppercase tracking-tighter" style={{ WebkitTextStroke: '2px #2D1A11', textShadow: '0 4px 4px rgba(0,0,0,0.5)' }}>
              Shift Over
            </h2>
            <p className="text-[#F4D0A4] mb-4 text-base md:text-lg font-bold" style={{ WebkitTextStroke: '0.5px #2D1A11' }}>
              You survived and reached Level {stats.level}.
            </p>
            
            <div className="bg-[#2D1A11] rounded-xl border-2 border-[#1A0F09] p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[#A88A72] font-bold">Final Score:</span>
                <span className="text-[#2ecc71] font-black text-2xl">
                  {((stats.level * 1000) + (stats.gems * 10) + Math.floor(stats.time * 5)).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#A88A72]">Time Survived:</span>
                <span className="text-[#F4D0A4] font-bold">{Math.floor(stats.time / 60)}:{(Math.floor(stats.time) % 60).toString().padStart(2, '0')}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#A88A72]">Gems Collected:</span>
                <span className="text-[#3498db] font-bold">{stats.gems}</span>
              </div>
            </div>

            {!scoreSubmitted && !showLeaderboard ? (
              <div className="mb-6 space-y-3">
                <input 
                  type="text" 
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={15}
                  className="w-full bg-[#1A0F09] border-2 border-[#4A2F1D] rounded-lg px-4 py-3 text-[#F4D0A4] font-bold outline-none focus:border-[#F4D0A4] text-center uppercase"
                />
                <button 
                  onClick={submitScore}
                  disabled={!playerName.trim() || isSubmittingScore}
                  className="w-full py-3 bg-gradient-to-b from-[#3498db] to-[#2980b9] hover:from-[#5dade2] hover:to-[#3498db] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-xl text-lg uppercase tracking-widest transition-colors shadow-lg border-4 border-[#2D1A11] flex items-center justify-center gap-2"
                  style={{ WebkitTextStroke: '1px #2D1A11' }}
                >
                  {isSubmittingScore ? <Loader2 className="animate-spin" /> : <Trophy size={20} />}
                  SUBMIT SCORE
                </button>
              </div>
            ) : showLeaderboard ? (
              <div className="mb-6 bg-[#2D1A11] rounded-xl border-2 border-[#1A0F09] p-3 max-h-48 overflow-y-auto custom-scrollbar">
                <h3 className="text-[#F4D0A4] font-black mb-2 text-center border-b border-[#4A2F1D] pb-1">TOP MINERS</h3>
                {leaderboard.map((entry, index) => (
                  <div key={index} className={`flex justify-between items-center p-1 ${entry.name === playerName.trim() ? 'bg-[#4A2F1D] rounded' : ''}`}>
                    <span className="text-[#F4D0A4] font-bold text-sm truncate max-w-[120px]">
                      {index + 1}. {entry.name}
                    </span>
                    <span className="text-[#2ecc71] font-black text-sm">
                      {entry.score.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setGameState('menu');
                  fetchLeaderboard();
                }}
                className="flex-1 py-3 bg-gradient-to-b from-[#7f8c8d] to-[#95a5a6] hover:from-[#95a5a6] hover:to-[#bdc3c7] text-white font-black rounded-xl text-lg uppercase tracking-widest transition-colors shadow-lg border-4 border-[#2D1A11]"
                style={{ WebkitTextStroke: '1px #2D1A11' }}
              >
                MENU
              </button>
              <button 
                onClick={startGame}
                className="flex-1 py-3 bg-gradient-to-b from-[#e74c3c] to-[#c0392b] hover:from-[#ff6b6b] hover:to-[#e74c3c] text-[#F4D0A4] font-black rounded-xl text-lg uppercase tracking-widest transition-colors shadow-lg border-4 border-[#2D1A11]"
                style={{ WebkitTextStroke: '1px #2D1A11' }}
              >
                RETRY
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
