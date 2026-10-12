import { useState, useMemo, useEffect } from 'react';
import {
  COMMON_EQUIPMENT_DATA,
  EPIC_EQUIPMENT_DATA,
  calculateRequiredOres,
} from './data/defaultOreData';
import {
  INITIAL_CLAN_INFO,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_WAR_RULES,
  ClanInfo,
  ClanAnnouncement,
} from './data/clanData';
import { fetchLiveClanData } from './services/cocApi';

type HubTab = 'home' | 'calculator' | 'roster' | 'announcements' | 'rules' | 'hallOfFame';
type EquipmentTier = 'common' | 'epic';

interface SavedCalculatorState {
  tier: EquipmentTier;
  currentLevel: number;
  goalLevel: number;
  blueOwned: number;
  purpleOwned: number;
  goldOwned: number;
}

const CALC_STORAGE_KEY = 'demigodz_ore_calculator_state_v1';
const ANNOUNCEMENTS_STORAGE_KEY = 'demigodz_announcements_v1';

const loadSavedCalculator = (): SavedCalculatorState => {
  try {
    const saved = localStorage.getItem(CALC_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const tier: EquipmentTier = parsed.tier === 'epic' ? 'epic' : 'common';
      const maxLvl = tier === 'common' ? 18 : 27;
      const currentLevel = Math.max(1, Math.min(Number(parsed.currentLevel) || 1, maxLvl));
      const goalLevel = Math.max(currentLevel, Math.min(Number(parsed.goalLevel) || maxLvl, maxLvl));

      return {
        tier,
        currentLevel,
        goalLevel,
        blueOwned: typeof parsed.blueOwned === 'number' ? Math.max(0, parsed.blueOwned) : 0,
        purpleOwned: typeof parsed.purpleOwned === 'number' ? Math.max(0, parsed.purpleOwned) : 0,
        goldOwned: typeof parsed.goldOwned === 'number' ? Math.max(0, parsed.goldOwned) : 0,
      };
    }
  } catch {
    // ignore
  }

  return {
    tier: 'common',
    currentLevel: 1,
    goalLevel: 18,
    blueOwned: 0,
    purpleOwned: 0,
    goldOwned: 0,
  };
};

export default function App() {
  // First load lands on the cinematic Landing Page ('home')!
  const [activeTab, setActiveTab] = useState<HubTab>('home');
  const [clanInfo, setClanInfo] = useState<ClanInfo>(INITIAL_CLAN_INFO);
  const [isLiveSyncing, setIsLiveSyncing] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  const [announcements, setAnnouncements] = useState<ClanAnnouncement[]>(() => {
    try {
      const saved = localStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_ANNOUNCEMENTS;
  });

  // Roster Filters
  const [rosterSearch, setRosterSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'leader' | 'coLeader' | 'admin' | 'member'>('all');
  const [thFilter, setThFilter] = useState<number | 'all'>('all');

  // New Announcement Modal State
  const [showNewAnnModal, setShowNewAnnModal] = useState(false);
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [newAnnCategory, setNewAnnCategory] = useState<'CWL' | 'War' | 'Raid' | 'General'>('General');
  const [newAnnAuthor, setNewAnnAuthor] = useState('♣♠MaC.SmurF♠♣ (Leader)');

  // Toast Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Live Sync with Supercell API on mount
  useEffect(() => {
    handleSyncClan(false);
  }, []);

  const handleSyncClan = async (notify: boolean = true) => {
    setIsLiveSyncing(true);
    try {
      const res = await fetchLiveClanData(clanInfo.tag);
      if (res.data) {
        setClanInfo(res.data);
        setIsLiveConnected(res.isLive);
        if (notify) {
          showToast(res.isLive ? 'Live Supercell data synced!' : 'Synced official Demi GoDz PH data!');
        }
      }
    } catch {
      if (notify) showToast('Loaded cached clan data.');
    } finally {
      setIsLiveSyncing(false);
    }
  };

  // ----------------------------------------------------
  // CALCULATOR LOGIC
  // ----------------------------------------------------
  const [tier, setTier] = useState<EquipmentTier>(() => loadSavedCalculator().tier);
  const maxLevel = tier === 'common' ? 18 : 27;

  const [currentLevel, setCurrentLevel] = useState<number>(() => loadSavedCalculator().currentLevel);
  const [goalLevel, setGoalLevel] = useState<number>(() => loadSavedCalculator().goalLevel);

  const [blueOwned, setBlueOwned] = useState<number | ''>(() => loadSavedCalculator().blueOwned);
  const [purpleOwned, setPurpleOwned] = useState<number | ''>(() => loadSavedCalculator().purpleOwned);
  const [goldOwned, setGoldOwned] = useState<number | ''>(() => loadSavedCalculator().goldOwned);

  useEffect(() => {
    try {
      const stateToSave: SavedCalculatorState = {
        tier,
        currentLevel,
        goalLevel,
        blueOwned: blueOwned === '' ? 0 : blueOwned,
        purpleOwned: purpleOwned === '' ? 0 : purpleOwned,
        goldOwned: goldOwned === '' ? 0 : goldOwned,
      };
      localStorage.setItem(CALC_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // ignore
    }
  }, [tier, currentLevel, goalLevel, blueOwned, purpleOwned, goldOwned]);

  const activeData = tier === 'common' ? COMMON_EQUIPMENT_DATA : EPIC_EQUIPMENT_DATA;

  const handleTierChange = (newTier: EquipmentTier) => {
    setTier(newTier);
    const newMax = newTier === 'common' ? 18 : 27;
    if (currentLevel > newMax) setCurrentLevel(newMax);
    if (goalLevel > newMax) setGoalLevel(newMax);
  };

  const handleCurrentChange = (val: number) => {
    setCurrentLevel(val);
    if (goalLevel < val) setGoalLevel(val);
  };

  const handleGoalChange = (val: number) => {
    setGoalLevel(Math.max(val, currentLevel));
  };

  const required = useMemo(
    () => calculateRequiredOres(activeData, currentLevel, goalLevel),
    [activeData, currentLevel, goalLevel]
  );

  const blueOwnedNum = blueOwned === '' ? 0 : blueOwned;
  const purpleOwnedNum = purpleOwned === '' ? 0 : purpleOwned;
  const goldOwnedNum = goldOwned === '' ? 0 : goldOwned;

  const blueNeeded = required.blue - blueOwnedNum;
  const purpleNeeded = required.purple - purpleOwnedNum;
  const goldNeeded = required.gold - goldOwnedNum;

  const handleResetCalculator = () => {
    const defaultGoal = tier === 'common' ? 18 : 27;
    setCurrentLevel(1);
    setGoalLevel(defaultGoal);
    setBlueOwned(0);
    setPurpleOwned(0);
    setGoldOwned(0);
    showToast('Ore calculator reset to defaults.');
  };

  const levels = Array.from({ length: maxLevel }, (_, i) => i + 1);

  // ----------------------------------------------------
  // ROSTER & HALL OF FAME DERIVED DATA
  // ----------------------------------------------------
  const filteredMembers = useMemo(() => {
    return clanInfo.memberList.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
        m.tag.toLowerCase().includes(rosterSearch.toLowerCase());
      const matchesRole = roleFilter === 'all' || m.role === roleFilter;
      const matchesTh = thFilter === 'all' || m.townHallLevel === thFilter;
      return matchesSearch && matchesRole && matchesTh;
    });
  }, [clanInfo.memberList, rosterSearch, roleFilter, thFilter]);

  const topDonators = useMemo(() => {
    return [...clanInfo.memberList]
      .sort((a, b) => b.donations - a.donations)
      .slice(0, 5);
  }, [clanInfo.memberList]);

  const topVeterans = useMemo(() => {
    return [...clanInfo.memberList]
      .sort((a, b) => b.expLevel - a.expLevel)
      .slice(0, 5);
  }, [clanInfo.memberList]);


  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle.trim() || !newAnnContent.trim()) return;

    const newEntry: ClanAnnouncement = {
      id: `ann-${Date.now()}`,
      title: newAnnTitle.trim(),
      content: newAnnContent.trim(),
      category: newAnnCategory,
      date: new Date().toISOString().split('T')[0],
      isPinned: false,
      author: newAnnAuthor.trim() || 'Leader',
    };

    const updated = [newEntry, ...announcements];
    setAnnouncements(updated);
    try {
      localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    setNewAnnTitle('');
    setNewAnnContent('');
    setShowNewAnnModal(false);
    showToast('New announcement published!');
  };

  const handleCopyClanTag = () => {
    navigator.clipboard.writeText(clanInfo.tag);
    showToast(`Copied Clan Tag ${clanInfo.tag} to clipboard!`);
  };

  const handleCopyRules = () => {
    const text = INITIAL_WAR_RULES.map(
      (r, i) => `${i + 1}. [${r.category}] ${r.title}\n   ${r.description}`
    ).join('\n\n');
    navigator.clipboard.writeText(`🛡️ DEMI GODZ PH CLAN RULES 🛡️\n\n${text}`);
    showToast('Clan rules copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-white">
      {/* Top Clan Brand Header */}
      <header className="border-b border-slate-800/80 bg-[#090e1c]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Badge */}
          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 text-left group"
          >
            {clanInfo.badgeUrls?.medium ? (
              <img
                src={clanInfo.badgeUrls.medium}
                alt={clanInfo.name}
                className="w-10 h-10 object-contain drop-shadow group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-300 flex items-center justify-center font-black text-slate-950 text-lg">
                ⚡
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base sm:text-lg tracking-tight group-hover:text-amber-400 transition-colors">
                  {clanInfo.name}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Lv. {clanInfo.clanLevel}
                </span>
                {isLiveConnected && (
                  <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    LIVE
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyClanTag();
                  }}
                  className="hover:text-amber-300 cursor-pointer transition-colors"
                  title="Copy tag"
                >
                  {clanInfo.tag}
                </span>
                <span>·</span>
                <span className="text-slate-300 font-sans">{clanInfo.warLeague?.name || 'Master I'}</span>
                <span>·</span>
                <span className="text-emerald-400 font-sans font-semibold">🔥 {clanInfo.warWinStreak} Streak</span>
              </div>
            </div>
          </button>

          {/* Header Actions */}
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300 font-mono">
              👥 {clanInfo.members}/50
            </span>
            <button
              type="button"
              onClick={() => handleSyncClan(true)}
              disabled={isLiveSyncing}
              title="Refresh live data from Supercell"
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              <span className={isLiveSyncing ? 'animate-spin' : ''}>🔄</span>
              <span className="hidden sm:inline">{isLiveSyncing ? 'Syncing...' : 'Sync'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 border-t border-slate-800/60 scrollbar-none text-xs sm:text-sm font-semibold">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === 'home'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('roster')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === 'roster'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Member Roster ({clanInfo.memberList.length})
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === 'rules'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              War & CWL Rules
            </button>
            <button
              onClick={() => setActiveTab('announcements')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === 'announcements'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Announcements
            </button>
            <button
              onClick={() => setActiveTab('hallOfFame')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === 'hallOfFame'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Hall of Fame
            </button>
            <button
              onClick={() => setActiveTab('calculator')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === 'calculator'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Ore Calculator
            </button>
          </nav>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* ==================================================== */}
        {/* TAB: OVERVIEW / LANDING PAGE ($10,000 WORTHY HERO VIEW) */}
        {/* ==================================================== */}
        {activeTab === 'home' && (
          <div className="flex flex-col gap-8 sm:gap-10">
            {/* Hero Banner */}
            <section className="order-1 relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-b from-[#10172a] via-[#0a0f1d] to-[#070b14] p-6 sm:p-10 lg:p-12 shadow-2xl">
              {/* Subtle background glow */}
              <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left Hero Content */}
                <div className="lg:col-span-8 space-y-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                    <span>🇵🇭 Official Competitive Clan Hub</span>
                    <span>·</span>
                    <span>Level {clanInfo.clanLevel}</span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                    Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500">Demi GoDz PH</span>
                  </h1>

                  <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                    Very active and competitive Filipino clashers. Competing in{' '}
                    <strong className="text-amber-300 font-semibold">{clanInfo.warLeague?.name || 'Master League I'}</strong> with an active{' '}
                    <strong className="text-emerald-400 font-semibold">26-War Win Streak</strong>, Level 10 Capital Peak with 1.5k+ raid medals, and max clan games.
                  </p>

                  {/* Primary Call to Actions */}
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setActiveTab('roster')}
                      className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
                    >
                      <span>👥 View Clan Roster ({clanInfo.memberList.length})</span>
                    </button>

                    <button
                      onClick={handleCopyClanTag}
                      className="px-4 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-amber-300 font-mono text-xs border border-slate-800 transition-colors flex items-center gap-1.5"
                    >
                      <span>{clanInfo.tag}</span>
                      <span>📋</span>
                    </button>
                  </div>
                </div>

                {/* Right Hero Badge Showcase */}
                <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-md text-center space-y-4">
                  {clanInfo.badgeUrls?.large ? (
                    <img
                      src={clanInfo.badgeUrls.large}
                      alt={clanInfo.name}
                      className="w-36 h-36 object-contain drop-shadow-2xl animate-in zoom-in-95"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-4xl">
                      🛡️
                    </div>
                  )}

                  <div>
                    <h2 className="text-lg font-black text-white">{clanInfo.name}</h2>
                    <span className="text-xs text-slate-400 font-mono">{clanInfo.tag}</span>
                  </div>

                  <div className="w-full pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-slate-900/80">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Win Streak</span>
                      <span className="text-base font-extrabold text-emerald-400 font-mono">🔥 {clanInfo.warWinStreak}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/80">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">CWL Rank</span>
                      <span className="text-xs font-bold text-amber-300 truncate block mt-0.5">Master I</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Key Metrics Strip */}
            <section className="order-2 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-1">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-medium block">Clan Level</span>
                <span className="text-3xl font-black text-amber-400 font-mono">Level {clanInfo.clanLevel}</span>
                <span className="text-[11px] text-slate-500 block">Max Clan Perks</span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-1">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-medium block">War Victories</span>
                <span className="text-3xl font-black text-white font-mono">{clanInfo.warWins}</span>
                <span className="text-[11px] text-emerald-400 font-medium block">🔥 {clanInfo.warWinStreak} Consecutive</span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-1">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-medium block">Clan Points</span>
                <span className="text-3xl font-black text-white font-mono">{clanInfo.clanPoints?.toLocaleString()}</span>
                <span className="text-[11px] text-slate-500 block">{clanInfo.members}/50 Clashers</span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-1">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-medium block">Clan Capital</span>
                <span className="text-3xl font-black text-emerald-400 font-mono">Peak 10</span>
                <span className="text-[11px] text-slate-500 block">1.5K+ Weekly Medals</span>
              </div>
            </section>

            {/* Feature Bento Grid */}
            <section className="order-4 md:order-3 grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Ore Calculator */}
              <div
                onClick={() => setActiveTab('calculator')}
                className="group cursor-pointer p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-900 transition-all space-y-4"
              >
                <div className="w-12 h-12 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  ⚒️
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-sky-400 transition-colors">
                    Hero Ore Calculator
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Calculate exact Blue, Purple, and Gold ore requirements for Common (Lv 1–18) & Epic (Lv 1–27) hero equipment.
                  </p>
                </div>
                <span className="inline-flex items-center text-xs font-semibold text-sky-400 group-hover:translate-x-1 transition-transform">
                  Open Calculator →
                </span>
              </div>

              {/* Card 2: Clan Roster */}
              <div
                onClick={() => setActiveTab('roster')}
                className="group cursor-pointer p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 transition-all space-y-4"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  👥
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                    Official Clan Roster
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Explore all 38 verified members with live Town Hall levels, clan ranks, trophies, and seasonal donation totals.
                  </p>
                </div>
                <span className="inline-flex items-center text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
                  Explore Roster →
                </span>
              </div>

              {/* Card 3: War Rules */}
              <div
                onClick={() => setActiveTab('rules')}
                className="group cursor-pointer p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-rose-500/50 hover:bg-slate-900 transition-all space-y-4"
              >
                <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  📜
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-rose-400 transition-colors">
                    War & CWL Rulebook
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Master League I attack protocols, mirror callouts, hero availability rules, and clan promotion policies.
                  </p>
                </div>
                <span className="inline-flex items-center text-xs font-semibold text-rose-400 group-hover:translate-x-1 transition-transform">
                  Read Rulebook →
                </span>
              </div>
            </section>

            {/* Clan Announcement Spotlight */}
            <section className="order-3 md:order-4 p-5 sm:p-6 rounded-2xl bg-slate-900/70 border border-amber-500/30 md:border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📢</span>
                  <h3 className="font-bold text-white text-base">Latest Clan Notice</h3>
                </div>
                <button
                  onClick={() => setActiveTab('announcements')}
                  className="text-xs text-amber-400 hover:underline font-medium"
                >
                  View All ({announcements.length}) →
                </button>
              </div>

              {announcements[0] && (
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                      {announcements[0].category}
                    </span>
                    <h4 className="font-bold text-white text-sm">
                      {announcements[0].title}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {announcements[0].content}
                  </p>
                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>By: {announcements[0].author}</span>
                    <span>{announcements[0].date}</span>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB: ORE CALCULATOR */}
        {/* ==================================================== */}
        {activeTab === 'calculator' && (
          <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Hero Equipment Ore Calculator
                </h2>
                <p className="text-xs text-slate-400">
                  Calculate required ores for upgrades
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetCalculator}
                className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 bg-sky-950/60 hover:bg-sky-900/60 border border-sky-800/60 rounded-lg transition-colors"
              >
                Reset
              </button>
            </div>

            {/* Equipment Tier Switcher */}
            <div className="p-1 bg-slate-950 border border-slate-800 rounded-xl grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => handleTierChange('common')}
                className={`py-2 sm:py-2.5 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all text-center ${
                  tier === 'common'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                Common Equipment (Lv 1–18)
              </button>
              <button
                type="button"
                onClick={() => handleTierChange('epic')}
                className={`py-2 sm:py-2.5 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all text-center ${
                  tier === 'epic'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                Epic Equipment (Lv 1–27)
              </button>
            </div>

            {/* Level Selectors */}
            <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3.5 sm:p-5 shadow-sm">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Current Level
                  </label>
                  <select
                    value={currentLevel}
                    onChange={(e) => handleCurrentChange(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 sm:px-3 py-2 text-white font-mono text-base font-semibold focus:border-sky-500 focus:outline-none"
                  >
                    {levels.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        Level {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Goal Level
                  </label>
                  <select
                    value={goalLevel}
                    onChange={(e) => handleGoalChange(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 sm:px-3 py-2 text-sky-400 font-mono text-base font-semibold focus:border-sky-500 focus:outline-none"
                  >
                    {levels
                      .filter((lvl) => lvl >= currentLevel)
                      .map((lvl) => (
                        <option key={lvl} value={lvl}>
                          Level {lvl}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Calculation Table */}
            <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl overflow-hidden shadow-sm">
              <div className="px-3.5 sm:px-5 py-2.5 sm:py-3.5 bg-slate-800/90 border-b border-slate-700/60 flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-bold text-white">
                  Ores Calculation Matrix
                </h3>
              </div>

              <div className="w-full overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-900/80 border-b border-slate-700/60 text-[11px] sm:text-xs text-slate-300 font-semibold uppercase tracking-wider">
                      <th className="py-2.5 sm:py-3 px-2.5 sm:px-4 text-left">Ores</th>
                      <th className="py-2.5 sm:py-3 px-2 sm:px-4 text-right">Required</th>
                      <th className="py-2.5 sm:py-3 px-2 sm:px-4 text-right">Owned</th>
                      <th className="py-2.5 sm:py-3 px-2.5 sm:px-4 text-right">Needed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40 font-mono tabular-nums">
                    {/* Blue Ore */}
                    <tr className="hover:bg-slate-700/20 transition-colors">
                      <td className="py-2.5 sm:py-3.5 px-2.5 sm:px-4 font-sans font-bold text-sky-400">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-sky-400 shrink-0" />
                          <span>Blue</span>
                        </div>
                      </td>
                      <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-right text-slate-200 font-semibold text-xs sm:text-sm">
                        {required.blue.toLocaleString()}
                      </td>
                      <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-right">
                        <input
                          type="number"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          min="0"
                          value={blueOwned}
                          placeholder="0"
                          onChange={(e) =>
                            setBlueOwned(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))
                          }
                          className="w-20 sm:w-24 md:w-28 bg-slate-900 border border-slate-700 focus:border-sky-500 focus:outline-none rounded px-1.5 sm:px-2 py-1 text-right text-white font-mono text-base sm:text-sm"
                        />
                      </td>
                      <td className="py-2.5 sm:py-3.5 px-2.5 sm:px-4 text-right">
                        {blueNeeded <= 0 ? (
                          <span className="inline-block px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-bold text-xs sm:text-sm">
                            {blueNeeded.toLocaleString()}
                          </span>
                        ) : (
                          <span className="inline-block px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded bg-rose-950/80 border border-rose-500/50 text-rose-300 font-bold text-xs sm:text-sm">
                            {blueNeeded.toLocaleString()}
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* Purple Ore */}
                    <tr className="hover:bg-slate-700/20 transition-colors">
                      <td className="py-2.5 sm:py-3.5 px-2.5 sm:px-4 font-sans font-bold text-purple-400">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-purple-400 shrink-0" />
                          <span>Purple</span>
                        </div>
                      </td>
                      <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-right text-slate-200 font-semibold text-xs sm:text-sm">
                        {required.purple.toLocaleString()}
                      </td>
                      <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-right">
                        <input
                          type="number"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          min="0"
                          value={purpleOwned}
                          placeholder="0"
                          onChange={(e) =>
                            setPurpleOwned(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))
                          }
                          className="w-20 sm:w-24 md:w-28 bg-slate-900 border border-slate-700 focus:border-purple-500 focus:outline-none rounded px-1.5 sm:px-2 py-1 text-right text-white font-mono text-base sm:text-sm"
                        />
                      </td>
                      <td className="py-2.5 sm:py-3.5 px-2.5 sm:px-4 text-right">
                        {purpleNeeded <= 0 ? (
                          <span className="inline-block px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-bold text-xs sm:text-sm">
                            {purpleNeeded.toLocaleString()}
                          </span>
                        ) : (
                          <span className="inline-block px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded bg-rose-950/80 border border-rose-500/50 text-rose-300 font-bold text-xs sm:text-sm">
                            {purpleNeeded.toLocaleString()}
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* Gold Ore (Epic Equipment only) */}
                    {tier === 'epic' && (
                      <tr className="hover:bg-slate-700/20 transition-colors">
                        <td className="py-2.5 sm:py-3.5 px-2.5 sm:px-4 font-sans font-bold text-amber-400">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-400 shrink-0" />
                            <span>Gold</span>
                          </div>
                        </td>
                        <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-right text-slate-200 font-semibold text-xs sm:text-sm">
                          {required.gold.toLocaleString()}
                        </td>
                        <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-right">
                          <input
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            min="0"
                            value={goldOwned}
                            placeholder="0"
                            onChange={(e) =>
                              setGoldOwned(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))
                            }
                            className="w-20 sm:w-24 md:w-28 bg-slate-900 border border-slate-700 focus:border-amber-500 focus:outline-none rounded px-1.5 sm:px-2 py-1 text-right text-white font-mono text-base sm:text-sm"
                          />
                        </td>
                        <td className="py-2.5 sm:py-3.5 px-2.5 sm:px-4 text-right">
                          {goldNeeded <= 0 ? (
                            <span className="inline-block px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-bold text-xs sm:text-sm">
                              {goldNeeded.toLocaleString()}
                            </span>
                          ) : (
                            <span className="inline-block px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded bg-rose-950/80 border border-rose-500/50 text-rose-300 font-bold text-xs sm:text-sm">
                              {goldNeeded.toLocaleString()}
                            </span>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Note */}
            <div className="p-3 sm:p-4 bg-slate-800/40 border border-slate-700/40 rounded-xl text-xs text-slate-300 flex items-start gap-2.5 leading-relaxed">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
              <div>
                <strong className="text-white">Status: </strong>
                {(tier === 'common' ? blueNeeded <= 0 && purpleNeeded <= 0 : blueNeeded <= 0 && purpleNeeded <= 0 && goldNeeded <= 0) ? (
                  <span className="text-emerald-400 font-semibold">
                    You have all required ores to reach Level {goalLevel}!
                  </span>
                ) : (
                  <span>
                    To reach Level {goalLevel}, you still need{' '}
                    {blueNeeded > 0 && (
                      <span className="text-sky-300 font-semibold font-mono">
                        {blueNeeded.toLocaleString()} Blue{' '}
                      </span>
                    )}
                    {purpleNeeded > 0 && (
                      <span className="text-purple-300 font-semibold font-mono">
                        {purpleNeeded.toLocaleString()} Purple{' '}
                      </span>
                    )}
                    {tier === 'epic' && goldNeeded > 0 && (
                      <span className="text-amber-300 font-semibold font-mono">
                        {goldNeeded.toLocaleString()} Gold
                      </span>
                    )}
                    .
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB: MEMBER DIRECTORY (ROSTER) */}
        {/* ==================================================== */}
        {activeTab === 'roster' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Clan Member Directory
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Official roster showing Town Hall levels, roles, and donations
                </p>
              </div>

              <span className="text-xs font-mono text-slate-400">
                Showing <strong className="text-white">{filteredMembers.length}</strong> of{' '}
                {clanInfo.memberList.length} members
              </span>
            </div>

            {/* Filter Bar */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search by player name or tag..."
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                >
                  <option value="all">All Roles</option>
                  <option value="leader">Leader</option>
                  <option value="coLeader">Co-Leader</option>
                  <option value="admin">Elder</option>
                  <option value="member">Member</option>
                </select>

                <select
                  value={thFilter}
                  onChange={(e) => setThFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs font-mono"
                >
                  <option value="all">All Town Halls</option>
                  <option value={18}>TH 18</option>
                  <option value={17}>TH 17</option>
                  <option value={16}>TH 16</option>
                  <option value={15}>TH 15</option>
                  <option value={14}>TH 14</option>
                </select>
              </div>
            </div>

            {/* Roster Table */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] sm:text-xs text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-3 sm:px-4 text-left">Rank & Member</th>
                      <th className="py-3 px-3 sm:px-4 text-center">Town Hall</th>
                      <th className="py-3 px-3 sm:px-4 text-center">Role</th>
                      <th className="py-3 px-3 sm:px-4 text-right">Trophies</th>
                      <th className="py-3 px-3 sm:px-4 text-right">Donations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
                    {filteredMembers.map((member) => {
                      const roleBadge = {
                        leader: 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold',
                        coLeader: 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-semibold',
                        admin: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
                        member: 'bg-slate-800 text-slate-400 border-slate-700',
                      }[member.role];

                      const roleLabel = {
                        leader: 'Leader',
                        coLeader: 'Co-Leader',
                        admin: 'Elder',
                        member: 'Member',
                      }[member.role];

                      const thColor =
                        member.townHallLevel >= 18
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black'
                          : member.townHallLevel === 17
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : member.townHallLevel === 16
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : member.townHallLevel === 15
                          ? 'bg-purple-500 text-white font-bold'
                          : member.townHallLevel === 14
                          ? 'bg-cyan-600 text-white'
                          : 'bg-blue-600 text-white';

                      return (
                        <tr key={member.tag} className="hover:bg-slate-800/30 transition-colors">
                          {/* Member IGN & Tag */}
                          <td className="py-3 px-3 sm:px-4 font-sans font-medium text-white">
                            <div className="flex items-center gap-2.5">
                              <span className="text-slate-500 font-mono text-xs w-5 text-right">
                                #{member.clanRank}
                              </span>
                              <div>
                                <span className="font-bold text-white text-sm block">
                                  {member.name}
                                </span>
                                <span className="text-[11px] font-mono text-slate-500 block">
                                  {member.tag} · Lv. {member.expLevel}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Town Hall Badge */}
                          <td className="py-3 px-3 sm:px-4 text-center font-sans">
                            <span className={`inline-block px-2.5 py-0.5 rounded text-xs shadow-xs ${thColor}`}>
                              TH {member.townHallLevel}
                            </span>
                          </td>

                          {/* Role Badge */}
                          <td className="py-3 px-3 sm:px-4 text-center font-sans">
                            <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] border ${roleBadge}`}>
                              {roleLabel}
                            </span>
                          </td>

                          {/* Trophies */}
                          <td className="py-3 px-3 sm:px-4 text-right text-slate-200 font-semibold">
                            🏆 {member.trophies.toLocaleString()}
                          </td>

                          {/* Donations */}
                          <td className="py-3 px-3 sm:px-4 text-right">
                            <span className="text-emerald-400 font-bold">
                              ▲ {member.donations.toLocaleString()}
                            </span>
                            <span className="text-slate-500 text-[11px] block">
                              ▼ {member.donationsReceived.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB: WAR & CWL RULES */}
        {/* ==================================================== */}
        {activeTab === 'rules' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Demi GoDz PH War & CWL Rulebook
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Standard operating rules for competitive clan wars (Master League I)
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyRules}
                className="px-3.5 py-2 text-xs font-semibold text-rose-300 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto"
              >
                <span>📋 Copy Rules for FB/GC</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {INITIAL_WAR_RULES.map((rule) => {
                const badgeColor = {
                  CWL: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                  'Classic War': 'bg-rose-500/20 text-rose-300 border-rose-500/30',
                  General: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
                  'Demotion Policy': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
                }[rule.category];

                return (
                  <div
                    key={rule.id}
                    className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${badgeColor}`}>
                        {rule.category}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-base">
                      {rule.title}
                    </h3>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {rule.description}
                    </p>

                    {rule.highlight && (
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] font-medium text-amber-300/90 flex items-center gap-2">
                        <span>⚡</span>
                        <span>{rule.highlight}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB: ANNOUNCEMENTS BOARD */}
        {/* ==================================================== */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Clan Announcements & War Notices
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Official notices from Demi GoDz PH leadership
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowNewAnnModal(true)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <span>+ Post Notice</span>
              </button>
            </div>

            <div className="space-y-4">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className={`p-5 rounded-xl border bg-slate-900/70 backdrop-blur-sm transition-all ${
                    ann.isPinned
                      ? 'border-amber-500/50 shadow-[0_0_20px_-5px_rgba(245,158,11,0.15)]'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {ann.isPinned && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          📌 Pinned
                        </span>
                      )}
                      <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-slate-800 text-slate-300">
                        {ann.category}
                      </span>
                      <h3 className="font-bold text-white text-base">
                        {ann.title}
                      </h3>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      {ann.date}
                    </span>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {ann.content}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span>
                      Posted by: <strong className="text-slate-200">{ann.author}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Post Modal */}
            {showNewAnnModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white">
                      New Clan Announcement
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowNewAnnModal(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-medium text-slate-300 mb-1">
                        Category
                      </label>
                      <select
                        value={newAnnCategory}
                        onChange={(e) => setNewAnnCategory(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                      >
                        <option value="CWL">CWL</option>
                        <option value="War">Classic War</option>
                        <option value="Raid">Raid Weekend</option>
                        <option value="General">General</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-slate-300 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Master I CWL Round 3 Strategy"
                        value={newAnnTitle}
                        onChange={(e) => setNewAnnTitle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-300 mb-1">
                        Content / Instructions
                      </label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Write your announcement details here..."
                        value={newAnnContent}
                        onChange={(e) => setNewAnnContent(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-300 mb-1">
                        Author Name & Role
                      </label>
                      <input
                        type="text"
                        value={newAnnAuthor}
                        onChange={(e) => setNewAnnAuthor(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowNewAnnModal(false)}
                        className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow"
                      >
                        Publish Notice
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB: HALL OF FAME */}
        {/* ==================================================== */}
        {activeTab === 'hallOfFame' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Demi GoDz PH Hall of Fame
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Celebrating top troop donators and veteran clashers (Level 20 Clan)
              </p>
            </div>

            {/* War Record Showcase */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 shadow-xl flex flex-wrap items-center justify-between gap-6">
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wider text-amber-400 font-bold block">
                  War Excellence
                </span>
                <h3 className="text-2xl font-black text-white">
                  🔥 26 Consecutive War Wins
                </h3>
                <p className="text-xs text-slate-300">
                  Total Wars Won: <strong className="text-white">{clanInfo.warWins}</strong> · Competing in <strong className="text-amber-300">{clanInfo.warLeague?.name || 'Master League I'}</strong>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                  <span className="text-[10px] uppercase text-slate-400 block">Total Clan Points</span>
                  <span className="text-lg font-bold font-mono text-amber-400">
                    {clanInfo.clanPoints?.toLocaleString()}
                  </span>
                </div>
                <div className="px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                  <span className="text-[10px] uppercase text-slate-400 block">Capital Peak</span>
                  <span className="text-lg font-bold font-mono text-emerald-400">
                    Level 10
                  </span>
                </div>
              </div>
            </div>

            {/* Top Donators Podium */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-emerald-950/30 to-slate-900 border border-emerald-500/30 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">📦</span>
                <div>
                  <h3 className="font-bold text-white text-base">
                    Active Season Donation MVPs
                  </h3>
                  <p className="text-xs text-emerald-300/80">
                    Generous clanmates keeping everyone supplied with max troops
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-800/60 bg-slate-950/80 rounded-xl border border-slate-800">
                {topDonators.map((donor, i) => (
                  <div
                    key={donor.tag}
                    className="p-3.5 sm:px-5 flex items-center justify-between gap-3 text-xs sm:text-sm font-sans"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-800 font-mono text-xs font-bold text-slate-300 flex items-center justify-center">
                        #{i + 1}
                      </span>
                      <div>
                        <span className="font-bold text-white block">
                          {donor.name}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          TH {donor.townHallLevel} · {donor.tag}
                        </span>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-emerald-400 font-bold text-sm sm:text-base block">
                        ▲ {donor.donations.toLocaleString()}
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        Received: {donor.donationsReceived.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Veteran Clashers */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-purple-950/30 to-slate-900 border border-purple-500/30 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🎖️</span>
                <div>
                  <h3 className="font-bold text-white text-base">
                    Highest Experience Veterans
                  </h3>
                  <p className="text-xs text-purple-300/80">
                    Long-standing Demi GoDz PH clashers with the highest account levels
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-800/60 bg-slate-950/80 rounded-xl border border-slate-800">
                {topVeterans.map((vet, i) => (
                  <div
                    key={vet.tag}
                    className="p-3.5 sm:px-5 flex items-center justify-between gap-3 text-xs sm:text-sm font-sans"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-800 font-mono text-xs font-bold text-slate-300 flex items-center justify-center">
                        #{i + 1}
                      </span>
                      <div>
                        <span className="font-bold text-white block">
                          {vet.name}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          TH {vet.townHallLevel} · {vet.tag}
                        </span>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-purple-300 font-bold text-sm sm:text-base block">
                        Level {vet.expLevel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#060a12] py-6 text-xs text-slate-500 text-center">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">Demi GoDz PH</span>
            <span>·</span>
            <span>Clan Tag: <strong className="text-slate-400 font-mono">{clanInfo.tag}</strong></span>
          </div>
          <div>
            <span>Clash of Clans is a trademark of Supercell Oy. Unofficial clan portal.</span>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-amber-500/40 text-amber-200 px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
