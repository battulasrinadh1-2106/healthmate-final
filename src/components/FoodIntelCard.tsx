/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { FoodItem, BMIClassification } from '../types';
import { getPersonalizedFoodIntelligence } from '../data/foods';
import { 
  Flame, 
  Sparkles, 
  Compass, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Activity, 
  Moon, 
  Sun, 
  Coffee, 
  Cookie
} from 'lucide-react';

interface FoodIntelCardProps {
  food: FoodItem;
  bmiClassification: BMIClassification;
  userAge: number;
  activityLevel: 'sedentary' | 'moderate' | 'active';
  userGender?: 'male' | 'female' | 'other';
  onClose?: () => void;
}

export default function FoodIntelCard({ 
  food, 
  bmiClassification, 
  userAge, 
  activityLevel,
  userGender,
  onClose 
}: FoodIntelCardProps) {
  
  // Calculate dynamic personalized food feedback using rule-based decision logic
  const advice = getPersonalizedFoodIntelligence(food, bmiClassification, userAge, activityLevel, userGender);

  // Total macros calculation for percentage distribution
  const totalMacrosGrams = food.macros.carbs + food.macros.protein + food.macros.fat;
  const carbsPct = totalMacrosGrams ? Math.round((food.macros.carbs / totalMacrosGrams) * 100) : 0;
  const proteinPct = totalMacrosGrams ? Math.round((food.macros.protein / totalMacrosGrams) * 100) : 0;
  const fatPct = totalMacrosGrams ? Math.round((food.macros.fat / totalMacrosGrams) * 100) : 0;

  // Icons mapping for custom advice workout suggests
  const workoutIconMap: Record<string, React.ReactNode> = {
    Flame: <Flame className="w-5 h-5 text-red-400" />,
    UserCheck: <Activity className="w-5 h-5 text-emerald-400" />,
    TrendingUp: <Activity className="w-5 h-5 text-purple-400" />,
    Zap: <Activity className="w-5 h-5 text-amber-500" />,
    Smile: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    Activity: <Activity className="w-5 h-5 text-emerald-400" />,
    Dumbbell: <DumbbellIcon className="w-5 h-5 text-teal-400" />
  };

  function DumbbellIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6.5 6.5h11" />
        <path d="M6.5 17.5h11" />
        <path d="M3 10V6a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v4" />
        <path d="M16 10V6a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v4" />
        <path d="M3 14v4a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-4" />
        <path d="M16 14v4a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-4" />
        <path d="M8 10v4h8v-4z" />
      </svg>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 15 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative"
    >
      {/* Top action header for modal look (if onClose provided) */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-950/80 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
          title="Close details"
        >
          &times;
        </button>
      )}

      {/* Main Image Banner */}
      <div className="relative h-48 md:h-56 overflow-hidden">
        <img
          src={food.image}
          alt={food.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
        
        {/* Float tags */}
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="px-3 py-1 bg-slate-950/80 backdrop-blur-md rounded-full text-xs text-slate-300 font-medium tracking-wide">
            {food.category}
          </span>
          <span className="px-3 py-1 bg-emerald-500/90 text-slate-950 rounded-full text-xs font-mono font-bold tracking-wide shadow-md shadow-emerald-500/20">
            {food.servingSize}
          </span>
        </div>

        {/* Floating Calories Badge */}
        <div className="absolute bottom-4 right-4 text-right">
          <div className="px-4 py-1.5 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl flex flex-col items-center">
            <span className="text-[10px] text-slate-500 font-mono tracking-wider font-bold uppercase leading-none">ENERGY</span>
            <span className="font-display font-extrabold text-2xl text-emerald-400 font-mono leading-tight">{food.calories}</span>
            <span className="text-[10px] text-slate-400 font-mono leading-none">kCal</span>
          </div>
        </div>
      </div>

      {/* Card Contents */}
      <div className="p-6 space-y-6">
        <div>
          <h3 className="font-display text-2xl font-bold text-slate-100">{food.name}</h3>
          <p className="text-xs text-slate-400 mt-1 leading-normal font-sans">
            {food.description}
          </p>
        </div>

        {/* Smart Personalized Verdict Badge */}
        <div className={`p-4 border rounded-2xl ${advice.colorClass} transition-all`}>
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              {advice.verdict === 'Can Eat' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : advice.verdict === 'Occasional' ? (
                <HelpCircle className="w-5 h-5 text-yellow-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              )}
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase">
                  HEALTHMATE VERDICT:
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold font-display uppercase tracking-wider ${advice.badgeColorClass}`}>
                  {advice.verdict === 'Limit / Avoid' ? 'AVOID / LIMIT' : advice.verdict}
                </span>
              </div>
              <p className={`text-sm leading-relaxed font-sans ${advice.textColorClass}`}>
                {advice.warningText}
              </p>
            </div>
          </div>
        </div>

        {/* Nutritional Macronutrients Section */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Nutritional Macros Composition
          </h4>
          
          <div className="grid grid-cols-3 gap-2.5">
            {/* Protein Card */}
            <div className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl flex flex-col">
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">PROTEIN</span>
              <span className="font-display font-bold text-base text-emerald-400 mt-1 font-mono">
                {food.macros.protein}g
              </span>
              <div className="w-full h-1 bg-slate-850 rounded-full mt-2 overflow-hidden">
                <div style={{ width: `${proteinPct}%` }} className="bg-emerald-500 h-full rounded-full" />
              </div>
              <span className="text-[9px] text-slate-600 mt-1 font-mono">{proteinPct}% of weight</span>
            </div>

            {/* Carbs Card */}
            <div className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl flex flex-col">
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">CARBS</span>
              <span className="font-display font-bold text-base text-amber-400 mt-1 font-mono">
                {food.macros.carbs}g
              </span>
              <div className="w-full h-1 bg-slate-850 rounded-full mt-2 overflow-hidden">
                <div style={{ width: `${carbsPct}%` }} className="bg-amber-400 h-full rounded-full" />
              </div>
              <span className="text-[9px] text-slate-600 mt-1 font-mono">{carbsPct}% of weight</span>
            </div>

            {/* Fats Card */}
            <div className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl flex flex-col">
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">FATS</span>
              <span className="font-display font-bold text-base text-rose-500 mt-1 font-mono">
                {food.macros.fat}g
              </span>
              <div className="w-full h-1 bg-slate-850 rounded-full mt-2 overflow-hidden">
                <div style={{ width: `${fatPct}%` }} className="bg-rose-500 h-full rounded-full" />
              </div>
              <span className="text-[9px] text-slate-600 mt-1 font-mono">{fatPct}% of weight</span>
            </div>
          </div>
        </div>

        {/* Dynamic Physical Burn Workout System */}
        <div className="p-4 bg-slate-950/80 border border-slate-850 rounded-2xl space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-teal-400" />
              Caloric Burn recommendation
            </h4>
            <span className="text-[10px] px-2 py-0.5 bg-slate-800 rounded-md font-mono text-slate-400">
              Personalized
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-200">
              {workoutIconMap[advice.workoutIcon] || <Activity className="w-5 h-5 text-emerald-400" />}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200 font-display">
                {advice.suggestedWorkout}
              </p>
              <div className="flex items-center gap-1 text-slate-500 text-[11px] mt-0.5 font-mono">
                <Clock className="w-3 h-3 text-slate-600" />
                Duration required:{' '}
                <span className="text-amber-400 font-bold">{advice.workoutDuration} minutes</span>
              </div>
            </div>
          </div>

          {/* Detailed side-by-side alternative options */}
          <div className="border-t border-slate-900 pt-3 flex justify-between text-center">
            <div className="flex-1">
              <span className="text-[9px] text-slate-500 font-mono block uppercase">WALKING</span>
              <span className="text-xs font-semibold text-slate-300 font-mono block mt-1">
                {Math.round(food.burnMetrics.walking * (activityLevel === 'sedentary' ? 1.2 : 0.9))}m
              </span>
            </div>
            <div className="w-[1px] bg-slate-900 h-6 my-auto" />
            <div className="flex-1">
              <span className="text-[9px] text-slate-500 font-mono block uppercase">JOGGING</span>
              <span className="text-xs font-semibold text-slate-300 font-mono block mt-1">
                {Math.round(food.burnMetrics.running * (activityLevel === 'sedentary' ? 1.2 : 0.9))}m
              </span>
            </div>
            <div className="w-[1px] bg-slate-900 h-6 my-auto" />
            <div className="flex-1">
              <span className="text-[9px] text-slate-500 font-mono block uppercase">CARDIO DRILL</span>
              <span className="text-xs font-semibold text-slate-300 font-mono block mt-1">
                {Math.round(food.burnMetrics.cardio * (activityLevel === 'sedentary' ? 1.2 : 0.9))}m
              </span>
            </div>
          </div>
        </div>

        {/* Portion intake guidance */}
        <div className="space-y-1.5 font-sans">
          <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block">
            SUGGESTED PORTION & FREQUENCY
          </span>
          <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/20 p-3 rounded-xl border border-slate-850">
            {advice.intakeGuidance}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
