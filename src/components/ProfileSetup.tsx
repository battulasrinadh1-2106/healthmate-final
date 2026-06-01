/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserProfile, Gender, ActivityLevel } from '../types';
import { User, Activity, ArrowRight, Sparkles, Scale, Accessibility } from 'lucide-react';

interface ProfileSetupProps {
  initialProfile?: UserProfile;
  onSubmit: (profile: UserProfile) => void;
  onBack?: () => void;
}

export default function ProfileSetup({ initialProfile, onSubmit, onBack }: ProfileSetupProps) {
  // Convenient defaults
  const [age, setAge] = useState<number>(initialProfile?.age || 28);
  const [gender, setGender] = useState<Gender>(initialProfile?.gender || 'male');
  const [height, setHeight] = useState<number>(initialProfile?.height || 172);
  const [weight, setWeight] = useState<number>(initialProfile?.weight || 68);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(initialProfile?.activityLevel || 'moderate');
  const [validationError, setValidationError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Bounds validation
    if (age < 12 || age > 110) {
      setValidationError('Please enter a valid age between 12 and 110.');
      return;
    }
    if (height < 90 || height > 260) {
      setValidationError('Please enter a height between 90cm and 260cm.');
      return;
    }
    if (weight < 25 || weight > 300) {
      setValidationError('Please enter a weight between 25kg and 300kg.');
      return;
    }

    setValidationError('');
    onSubmit({
      age,
      gender,
      height,
      weight,
      activityLevel
    });
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center bg-slate-950 text-slate-100 px-4 md:px-8 py-10 overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-[20%] left-[-20%] w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-20%] w-[500px] h-[500px] rounded-full bg-teal-500/5 blur-[140px] pointer-events-none" />

      <div className="max-w-xl w-full mx-auto bg-slate-900/60 border border-slate-800/80 p-6 md:p-8 rounded-3xl backdrop-blur-xl shadow-2xl relative z-10">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-500/5 text-teal-400 text-xs font-medium tracking-wide mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Biological Intelligence Matrix Setup
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight">
            Build Your health Profile
          </h2>
          <p className="text-sm text-slate-400 mt-1.5">
            Provide biological metrics to scale our food intelligence recommendations.
          </p>
        </div>

        {validationError && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-medium animate-pulse">
            {validationError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Gender Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase block">
              Biological Genus
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['male', 'female', 'other'] as Gender[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`py-3.5 px-2 rounded-2xl border text-center font-display font-medium text-sm transition-all focus:outline-none cursor-pointer capitalize ${
                    gender === g
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Age & Height & Weight Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Age input */}
            <div className="space-y-2">
              <label className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                Age (years)
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="12"
                  max="110"
                  value={age || ''}
                  onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl px-4 py-3.5 font-mono text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="e.g. 28"
                />
              </div>
            </div>

            {/* Height input */}
            <div className="space-y-2">
              <label className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase flex items-center gap-1">
                <Accessibility className="w-3.5 h-3.5 text-emerald-400" />
                Height (cm)
              </label>
              <input
                type="number"
                required
                min="90"
                max="260"
                value={height || ''}
                onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl px-4 py-3.5 font-mono text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="e.g. 175"
              />
            </div>

            {/* Weight input */}
            <div className="space-y-2">
              <label className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-emerald-400" />
                Weight (kg)
              </label>
              <input
                type="number"
                required
                min="25"
                max="300"
                value={weight || ''}
                onChange={(e) => setWeight(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl px-4 py-3.5 font-mono text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="e.g. 68"
              />
            </div>
          </div>

          {/* Activity level description cards */}
          <div className="space-y-2">
            <label className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Physical Lifestyle/Activity Level
            </label>
            <div className="grid grid-cols-1 gap-3">
              {(['sedentary', 'moderate', 'active'] as ActivityLevel[]).map((level) => {
                const isSelected = activityLevel === level;
                let title = '';
                let subtitle = '';
                if (level === 'sedentary') {
                  title = 'Sedentary';
                  subtitle = 'Office job, little or no regular workout exercises.';
                } else if (level === 'moderate') {
                  title = 'Moderate Active';
                  subtitle = 'Vigorous activity or sports scheduled 3-5 days a week.';
                } else {
                  title = 'Active Athlete';
                  subtitle = 'Intense sports training or heavy labor 6-7 days a week.';
                }

                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setActivityLevel(level)}
                    className={`p-3.5 rounded-2xl border text-left transition-all focus:outline-none cursor-pointer flex justify-between items-center ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 shadow-md shadow-emerald-500/10'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-800 hover:bg-slate-900/40'
                    }`}
                  >
                    <div>
                      <h4 className={`text-sm font-semibold font-display ${isSelected ? 'text-emerald-400' : 'text-slate-200'}`}>
                        {title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-normal">
                        {subtitle}
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-emerald-400 bg-emerald-500/20 text-emerald-400' : 'border-slate-800 text-transparent'
                    }`}>
                      <div className="w-2.5 h-2.5 rounded-full bg-current" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Buttons selection */}
          <div className="pt-4 flex gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="py-3.5 px-6 border border-slate-800 rounded-2xl bg-transparent text-slate-400 hover:text-slate-200 font-display font-medium text-sm transition-all focus:outline-none cursor-pointer"
              >
                Back
              </button>
            )}
            <button
              id="submit-profile-btn"
              type="submit"
              className="flex-1 py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-display font-semibold rounded-2xl shadow-lg transition-all focus:outline-none cursor-pointer flex items-center justify-center gap-2"
            >
              Set Health Parameters
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
