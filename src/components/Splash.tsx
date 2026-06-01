/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Flame, Apple, Sparkles, TrendingUp } from 'lucide-react';

interface SplashProps {
  onGetStarted: () => void;
}

export default function Splash({ onGetStarted }: SplashProps) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between bg-slate-950 text-slate-100 px-6 py-12 overflow-hidden selection:bg-emerald-500/30">
      {/* Background Decorative Glow */}
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none" />

      {/* Top Header Placeholder */}
      <div className="w-full flex justify-between items-center max-w-md z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Apple className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <span className="font-display font-bold text-lg tracking-wider bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            HEALTHMATE
          </span>
        </div>
        <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs font-mono text-emerald-400">
          v1.0.0 Stable
        </div>
      </div>

      {/* Hero Body */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-md text-center z-10 my-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="space-y-6"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-medium tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Empowering Your Nutrition Decisions
          </div>

          {/* Title and Tagline */}
          <div className="space-y-3">
            <h1 className="font-display text-5xl md:text-6xl font-extrabold tracking-tight">
              HEALTH
              <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-300 bg-clip-text text-transparent">
                MATE
              </span>
            </h1>
            <p className="font-display text-xl text-slate-400 tracking-wide font-light">
              Eat Smart <span className="text-emerald-500">•</span> Live Better
            </p>
          </div>

          {/* Description */}
          <p className="text-sm text-slate-400 leading-relaxed max-w-sm mx-auto font-sans">
            Your premium health intelligence companion. Calculate your body composition index, unlock highly personalized diet strategies, search any food, and master your caloric burn instantly.
          </p>

          {/* Key Features Cards List */}
          <div className="grid grid-cols-2 gap-3 pt-6 text-left">
            <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Flame className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-semibold font-display text-slate-200">Calorie Burning</h3>
              <p className="text-[10px] text-slate-500 leading-normal">Tailored workouts based on food intake.</p>
            </div>
            <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-semibold font-display text-slate-200">Food Intel Cards</h3>
              <p className="text-[10px] text-slate-500 leading-normal">Comprehensive warnings & composition logic.</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* CTA Button Section */}
      <div className="w-full max-w-sm text-center z-10 space-y-4">
        <motion.button
          id="get-started-btn"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onGetStarted}
          className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-display font-semibold rounded-2xl shadow-xl shadow-emerald-950/40 hover:shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 group text-base"
        >
          Begin Health Audit
          <TrendingUp className="w-5 h-5 text-slate-950 group-hover:translate-x-1 transition-transform" />
        </motion.button>
        <p className="text-[11px] text-slate-600 font-mono">
          Strictly Offline • Dynamic Local Rules
        </p>
      </div>
    </div>
  );
}
