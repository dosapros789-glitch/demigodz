import { useState, useMemo } from 'react';
import {
  COMMON_EQUIPMENT_DATA,
  EPIC_EQUIPMENT_DATA,
  calculateRequiredOres,
} from './data/defaultOreData';

type EquipmentTier = 'common' | 'epic';

export default function App() {
  const [tier, setTier] = useState<EquipmentTier>('common');

  // Common equipment caps at 18, Epic caps at 27
  const maxLevel = tier === 'common' ? 18 : 27;

  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [goalLevel, setGoalLevel] = useState<number>(18);

  // Owned ores (default to 0 on first load, persisted across tier switches)
  const [blueOwned, setBlueOwned] = useState<number | ''>(0);
  const [purpleOwned, setPurpleOwned] = useState<number | ''>(0);
  const [goldOwned, setGoldOwned] = useState<number | ''>(0);

  const activeData = tier === 'common' ? COMMON_EQUIPMENT_DATA : EPIC_EQUIPMENT_DATA;

  const handleTierChange = (newTier: EquipmentTier) => {
    setTier(newTier);
    const newMax = newTier === 'common' ? 18 : 27;
    if (currentLevel > newMax) {
      setCurrentLevel(newMax);
    }
    if (goalLevel > newMax) {
      setGoalLevel(newMax);
    }
  };

  const handleCurrentChange = (val: number) => {
    setCurrentLevel(val);
    if (goalLevel < val) {
      setGoalLevel(val);
    }
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

  const handleReset = () => {
    setCurrentLevel(1);
    setGoalLevel(tier === 'common' ? 18 : 27);
    setBlueOwned(0);
    setPurpleOwned(0);
    setGoldOwned(0);
  };

  const levels = Array.from({ length: maxLevel }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-3 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-row items-center justify-between pb-3 sm:pb-4 border-b border-slate-800 gap-2">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Ore Calculator
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              <span className="text-sky-400 font-semibold">DemiGodz PH</span> · Equipment Progression
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={handleReset}
              className="px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold text-sky-400 hover:text-sky-300 bg-sky-950/60 hover:bg-sky-900/60 border border-sky-800/60 rounded-lg transition-colors"
            >
              Reset
            </button>
          </div>
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
            Common (Lv 1–18)
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
            Epic (Lv 1–27)
          </button>
        </div>

        {/* Level Range Box */}
        <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3.5 sm:p-5 shadow-sm">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Current Level
              </label>
              <select
                value={currentLevel}
                onChange={(e) => handleCurrentChange(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 sm:px-3 py-2 text-white font-mono text-sm sm:text-base font-semibold focus:border-sky-500 focus:outline-none"
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
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 sm:px-3 py-2 text-sky-400 font-mono text-sm sm:text-base font-semibold focus:border-sky-500 focus:outline-none"
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

        {/* Calculation Results Table */}
        <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl overflow-hidden shadow-sm">
          <div className="px-3.5 sm:px-5 py-2.5 sm:py-3.5 bg-slate-800/90 border-b border-slate-700/60 flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-bold text-white">
              Ores Calculation Table
            </h2>
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

        {/* Quick Summary Note */}
        <div className="p-3 sm:p-4 bg-slate-800/40 border border-slate-700/40 rounded-xl text-xs text-slate-300 flex items-start gap-2 sm:gap-2.5 leading-relaxed">
          <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
          <div>
            <strong className="text-white">Summary ({tier === 'common' ? 'Common' : 'Epic'}): </strong>
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
    </div>
  );
}
