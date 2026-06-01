/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserProfile, BMIClassification } from '../types';
import { 
  calculateBMI, 
  classifyBMI, 
  getMotivationalMessage, 
  getPersonalizedMealSuggestions 
} from '../data/foods';
import { 
  Heart, 
  Search, 
  User, 
  Sparkles, 
  Apple, 
  Dumbbell, 
  Calendar, 
  RefreshCw, 
  ChevronRight, 
  Coffee, 
  Utensils, 
  Cookie, 
  Moon, 
  Compass, 
  TrendingUp, 
  CheckSquare,
  AlertTriangle,
  ServerOff,
  CornerDownRight
} from 'lucide-react';
import FoodSearch from './FoodSearch';

interface MainPageProps {
  profile: UserProfile;
  authUser: any;
  onEditProfile: () => void;
  onReset: () => void;
}

type TabType = 'dashboard' | 'search' | 'profile';

export default function MainPage({ profile, authUser, onEditProfile, onReset }: MainPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // BMI History database states integrated with MongoDB Express Backend
  const [bmiHistory, setBmiHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(true);
  const [newLogWeight, setNewLogWeight] = useState<string>('');
  const [newLogHeight, setNewLogHeight] = useState<string>(profile.height.toString());
  const [logSubmitStatus, setLogSubmitStatus] = useState<string>('');
  const [dbMode, setDbMode] = useState<string>('fallback-memory');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const fetchBmiHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await fetch("/api/bmi-history", {
        headers: {
          "x-user-id": authUser?._id || "",
        },
      });
      const json = await res.json();
      if (json.success) {
        setBmiHistory(json.data);
        if (json.databaseMode) {
          setDbMode(json.databaseMode);
        }
        if (json.connectionError) {
          setConnectionError(json.connectionError);
        } else {
          setConnectionError(null);
        }
      }
    } catch (err) {
      console.warn("Could not retrieve weight & BMI history from Express backend:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (authUser?._id) {
      fetchBmiHistory();
    }
  }, [authUser?._id]);

  const handleAddBmiLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(newLogWeight);
    const h = parseFloat(newLogHeight);
    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
      setLogSubmitStatus("Please specify valid weight & height numbers.");
      return;
    }
    try {
      setLogSubmitStatus("Writing log entry...");
      const response = await fetch("/api/save-bmi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": authUser?._id || "",
        },
        body: JSON.stringify({
          weight: w,
          height: h,
        }),
      });

      const json = await response.json();
      if (json.success) {
        setLogSubmitStatus("Log registered successfully!");
        setNewLogWeight('');
        fetchBmiHistory();
        
        // Update user state if possible to refresh active calculations
        profile.weight = w;
        profile.height = h;

        setTimeout(() => {
          setLogSubmitStatus("");
        }, 3000);
      } else {
        setLogSubmitStatus(`Error: ${json.error}`);
      }
    } catch (err: any) {
      setLogSubmitStatus(`Network failure: ${err.message}`);
    }
  };

  // Compute BMI and categorization
  const bmiScore = useMemo(() => {
    return calculateBMI(profile.height, profile.weight);
  }, [profile.height, profile.weight]);

  const bmiClassification = useMemo(() => {
    return classifyBMI(bmiScore);
  }, [bmiScore]);

  const motivationalMessage = useMemo(() => {
    return getMotivationalMessage(bmiClassification);
  }, [bmiClassification]);

  // Compute Meal Recommendations from database based on BMI Classification, gender, age, and activity level
  const mealSuggestions = useMemo(() => {
    return getPersonalizedMealSuggestions(bmiClassification, profile.age, profile.activityLevel, profile.gender);
  }, [bmiClassification, profile.age, profile.activityLevel, profile.gender]);

  // Design helpers
  const getBmiColorClasses = (classification: BMIClassification) => {
    switch (classification) {
      case 'Underweight':
        return {
          glow: 'from-amber-500/20 to-teal-500/20 border-teal-500/30',
          text: 'text-teal-400',
          bg: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
          progressColor: 'bg-teal-400',
          dialBg: 'border-teal-450'
        };
      case 'Healthy':
        return {
          glow: 'from-emerald-500/20 to-green-500/20 border-emerald-500/30',
          text: 'text-emerald-400',
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          progressColor: 'bg-emerald-400',
          dialBg: 'border-emerald-450'
        };
      case 'Overweight':
        return {
          glow: 'from-orange-500/20 to-amber-500/20 border-amber-550/30',
          text: 'text-amber-450',
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          progressColor: 'bg-amber-400',
          dialBg: 'border-amber-450'
        };
      case 'Obesity':
        return {
          glow: 'from-rose-500/20 to-red-500/20 border-red-550/30',
          text: 'text-red-400',
          bg: 'bg-red-500/10 text-red-500 border-red-500/20',
          progressColor: 'bg-red-400',
          dialBg: 'border-red-450'
        };
    }
  };

  const bmiTheme = getBmiColorClasses(bmiClassification);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-6">
      {/* Absolute background effects */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.03] blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] rounded-full bg-teal-500/[0.02] blur-[120px] pointer-events-none" />

      {/* Top Professional Header Bar */}
      <header className="sticky top-0 z-40 w-full h-18 bg-slate-950/80 backdrop-blur-md border-b border-slate-900/80 px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md">
            <Apple className="w-4.5 h-4.5 text-slate-950 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-base tracking-wider bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              HEALTHMATE
            </span>
            <span className="text-[9px] font-mono font-medium text-slate-500 tracking-wider">EAT SMART • LIVE BETTER</span>
          </div>
        </div>

        {/* Dynamic biological quick status pill */}
        <div className="hidden border border-slate-850 bg-slate-950/40 rounded-full py-1.5 px-3 md:flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-mono text-[9px] font-bold uppercase">BMI:</span>
            <span className={`font-mono font-bold ${bmiTheme.text}`}>{bmiScore}</span>
          </div>
          <span className="w-[1px] h-3.5 bg-slate-850" />
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-mono text-[9px] font-bold uppercase">ZONE:</span>
            <span className={`font-display font-bold ${bmiTheme.text}`}>{bmiClassification}</span>
          </div>
          <span className="w-[1px] h-3.5 bg-slate-850" />
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-mono text-[9px] font-bold uppercase">ACTIVITY:</span>
            <span className="font-display font-semibold text-slate-300 capitalize">{profile.activityLevel}</span>
          </div>
        </div>

        {/* Right side Profile controls */}
        <button
          onClick={onEditProfile}
          className="p-2 border border-slate-850 rounded-xl bg-slate-900 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/30 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium font-display"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Update Metrics
        </button>
      </header>

      {/* Main Container Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        
        {/* Tab switcher segmented buttons */}
        <div className="bg-slate-900/60 p-1 rounded-2xl border border-slate-900 flex max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-semibold font-display tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'dashboard'
                ? 'bg-slate-950 border border-slate-800 text-emerald-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            Health analysis
          </button>
          <button
            onClick={() => setActiveTab('search')}
            id="search-tab-trigger"
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-semibold font-display tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'search'
                ? 'bg-slate-950 border border-slate-800 text-emerald-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-4 h-4" />
            Food search
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-semibold font-display tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-slate-950 border border-slate-800 text-emerald-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            My stats
          </button>
        </div>

        {/* Tab panels implementations */}
        <div className="space-y-6">
          {activeTab === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Row 1: BMI Meter and Motivational health card */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                {/* BMI score dial radial card */}
                <div className="md:col-span-5 bg-slate-900/40 border border-slate-905 rounded-3xl p-6 flex flex-col justify-between items-center text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900/10 to-slate-950/20" />
                  
                  <span className="text-[10px] font-semibold font-mono tracking-wider text-slate-500 uppercase z-10 block mb-4">
                    Body Mass Index Summary
                  </span>

                  {/* Radial representation */}
                  <div className="relative w-44 h-44 flex items-center justify-center z-10">
                    <div className="absolute inset-0 rounded-full border border-dashed border-slate-800" />
                    {/* Glowing outer progress colored circle */}
                    <div className={`absolute inset-3 rounded-full border-2 ${bmiTheme.dialBg} animate-spin-slow`} style={{ strokeDasharray: '40 20' }} />
                    <div className="absolute inset-4 rounded-full bg-slate-950/90 border border-slate-850 flex flex-col items-center justify-center">
                      <span className="text-[10px] text-slate-500 font-mono tracking-widest font-bold block uppercase">CURRENT SCORE</span>
                      <h2 className={`font-display font-extrabold text-4xl mt-0.5 tracking-tight ${bmiTheme.text}`}>
                        {bmiScore}
                      </h2>
                      <span className="text-[10px] text-slate-400 mt-0.5 font-sans font-medium px-2 py-0.5 rounded bg-slate-900 border border-slate-850">
                        kg/m²
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 space-y-1 z-10">
                    <div className="flex items-center gap-1.5 justify-center">
                      <span className="text-slate-400 text-xs font-sans">Body Zone:</span>
                      <span className={`font-display font-bold text-base capitalize ${bmiTheme.text}`}>
                        {bmiClassification === 'Healthy' ? 'Healthy Fit' : bmiClassification}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Motivational and recommendations analysis advice block */}
                <div className={`md:col-span-7 border rounded-3xl p-6 flex flex-col justify-between bg-gradient-to-br ${bmiTheme.glow} backdrop-blur-xl relative overflow-hidden`}>
                  <div className="absolute top-4 right-4 text-emerald-400/15">
                    <Sparkles className="w-16 h-16 stroke-[1.5]" />
                  </div>

                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-500/5 text-teal-400 text-xs font-medium tracking-wide">
                      <Heart className="w-3.5 h-3.5 text-teal-400" />
                      Dynamic Health Advisor
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-display text-2xl font-bold text-slate-100">
                        {authUser?.name || "User"}'s Personal Diagnostics
                      </h3>
                      <p className="text-sm md:text-base text-slate-300 leading-relaxed font-sans mt-2">
                        {motivationalMessage}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-900/60 pt-4 mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="text-left">
                      <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block">PREVALENT STRATEGY</span>
                      <span className="text-xs font-semibold text-slate-300 mt-0.5 block font-display">
                        {bmiClassification === 'Obesity' || bmiClassification === 'Overweight' 
                          ? 'Consistent calorie calorie deficit and metabolism boosters' 
                          : bmiClassification === 'Underweight'
                          ? 'Nutrient-dense muscle-building structural calorie surplus'
                          : 'Maintenance of physical balance and lean macro levels'}
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveTab('search')}
                      className="py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-850 text-emerald-400 hover:text-emerald-300 font-display font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      Search Food Safety
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Personalized Diet Recommendation Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                    <Apple className="w-4.5 h-4.5 text-emerald-400" />
                    Personalized Daily Nutrition Strategy Plan 
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 bg-slate-900 rounded border border-slate-800 font-mono text-emerald-400 uppercase tracking-wide">
                    {bmiClassification} Ruleset
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Breakfast block */}
                  <div className="p-5 bg-slate-900/40 border border-slate-850 rounded-2xl flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 shrink-0">
                          <Coffee className="w-4.5 h-4.5" />
                        </div>
                        <h4 className="font-display font-bold text-sm text-slate-200">Breakfast</h4>
                      </div>
                      <span className="text-[9px] font-semibold text-slate-500 font-mono block uppercase">RECOMMENDED:</span>
                      <ul className="space-y-2">
                        {mealSuggestions.Breakfast.map((meal, index) => (
                          <li key={index} className="text-xs text-slate-300 leading-normal flex items-start gap-1.5">
                            <span className="text-emerald-500 font-bold shrink-0 mt-0.5">•</span>
                            <span>{meal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Lunch block */}
                  <div className="p-5 bg-slate-900/40 border border-slate-850 rounded-2xl flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                          <Utensils className="w-4.5 h-4.5" />
                        </div>
                        <h4 className="font-display font-bold text-sm text-slate-200">Lunch</h4>
                      </div>
                      <span className="text-[9px] font-semibold text-slate-500 font-mono block uppercase">RECOMMENDED:</span>
                      <ul className="space-y-2">
                        {mealSuggestions.Lunch.map((meal, index) => (
                          <li key={index} className="text-xs text-slate-300 leading-normal flex items-start gap-1.5">
                            <span className="text-emerald-500 font-bold shrink-0 mt-0.5">•</span>
                            <span>{meal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Snacks block */}
                  <div className="p-5 bg-slate-900/40 border border-slate-850 rounded-2xl flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-400 shrink-0">
                          <Cookie className="w-4.5 h-4.5" />
                        </div>
                        <h4 className="font-display font-bold text-sm text-slate-200">Snacks</h4>
                      </div>
                      <span className="text-[9px] font-semibold text-slate-500 font-mono block uppercase">RECOMMENDED:</span>
                      <ul className="space-y-2">
                        {mealSuggestions.Snacks.map((meal, index) => (
                          <li key={index} className="text-xs text-slate-300 leading-normal flex items-start gap-1.5">
                            <span className="text-emerald-500 font-bold shrink-0 mt-0.5">•</span>
                            <span>{meal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Dinner block */}
                  <div className="p-5 bg-slate-900/40 border border-slate-850 rounded-2xl flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                          <Moon className="w-4.5 h-4.5 animate-pulse" />
                        </div>
                        <h4 className="font-display font-bold text-sm text-slate-200">Dinner</h4>
                      </div>
                      <span className="text-[9px] font-semibold text-slate-500 font-mono block uppercase">RECOMMENDED:</span>
                      <ul className="space-y-2">
                        {mealSuggestions.Dinner.map((meal, index) => (
                          <li key={index} className="text-xs text-slate-300 leading-normal flex items-start gap-1.5">
                            <span className="text-emerald-500 font-bold shrink-0 mt-0.5">•</span>
                            <span>{meal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'search' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <FoodSearch
                bmiClassification={bmiClassification}
                userAge={profile.age}
                activityLevel={profile.activityLevel}
                userGender={profile.gender}
              />
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
            >
              {/* Biological Profile Grid Card */}
              <div className="lg:col-span-5 bg-slate-900/40 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-md space-y-6">
                <div>
                  <h3 className="font-display text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
                    Welcome, {authUser?.name || "User"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-normal font-sans">
                    These vital values are compiled in your secure cloud health account.
                  </p>
                </div>

                <div className="space-y-4 font-mono text-xs text-slate-300">
                  <div className="p-3.5 bg-slate-950/60 rounded-xl flex justify-between items-center border border-slate-850">
                    <span className="text-slate-500 font-bold uppercase">Logged In User:</span>
                    <span className="text-teal-450 capitalize font-bold font-display text-sm">{authUser?.name || "User"}</span>
                  </div>
                  <div className="p-3.5 bg-slate-950/60 rounded-xl flex justify-between items-center border border-slate-850">
                    <span className="text-slate-500 font-bold uppercase">Biological Genus:</span>
                    <span className="text-emerald-400 capitalize font-bold font-display text-sm">{profile.gender}</span>
                  </div>
                  <div className="p-3.5 bg-slate-950/60 rounded-xl flex justify-between items-center border border-slate-850">
                    <span className="text-slate-500 font-bold uppercase">Recorded Age:</span>
                    <span className="text-slate-200 font-bold text-sm font-mono">{profile.age} years</span>
                  </div>
                  <div className="p-3.5 bg-slate-950/60 rounded-xl flex justify-between items-center border border-slate-850">
                    <span className="text-slate-500 font-bold uppercase">Height Parameters:</span>
                    <span className="text-slate-200 text-sm font-mono font-bold">
                      {profile.height} cm ({(profile.height / 30.48).toFixed(1)} ft)
                    </span>
                  </div>
                  <div className="p-3.5 bg-slate-950/60 rounded-xl flex justify-between items-center border border-slate-850">
                    <span className="text-slate-500 font-bold uppercase">Weight Parameters:</span>
                    <span className="text-slate-200 text-sm font-mono font-bold">
                      {profile.weight} kg ({(profile.weight * 2.20462).toFixed(0)} lbs)
                    </span>
                  </div>
                  <div className="p-3.5 bg-slate-950/60 rounded-xl flex justify-between items-center border border-slate-850">
                    <span className="text-slate-500 font-bold uppercase">Activity Level:</span>
                    <span className="text-teal-400 text-sm font-display font-bold uppercase tracking-wider">{profile.activityLevel}</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={onEditProfile}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-display font-extrabold rounded-2xl text-xs hover:from-emerald-400 hover:to-teal-400 shadow-md transition-all cursor-pointer text-center block uppercase tracking-wide"
                  >
                    Edit health parameters form
                  </button>
                  <button
                    onClick={onReset}
                    className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-400 hover:text-red-400 hover:border-red-500/20 rounded-xl text-xs font-mono transition-all cursor-pointer"
                  >
                    Sign Out & Reset Session
                  </button>
                </div>
              </div>

              {/* Live Database Log Synchronization Desk (7 columns) */}
              <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800/80 p-6 rounded-3xl space-y-6">
                
                {/* Database state information header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-850 pb-4">
                  <div>
                    <h3 className="font-display text-xl font-bold text-slate-100 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      Weight & BMI Logging Desk
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-sans">
                      Chronological wellness metrics tracked securely in your database.
                    </p>
                  </div>
                  
                  {/* Database system indicator pill */}
                  <div className="flex items-center gap-2 self-start sm:self-center px-3 py-1 bg-slate-950/80 rounded-full border border-slate-850 text-[10px] font-mono">
                    <span className={`w-1.5 h-1.5 rounded-full ${dbMode === 'mongodb' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                    <span className="text-slate-400 uppercase tracking-wider">
                      DB Mode: <strong className={dbMode === 'mongodb' ? 'text-emerald-400' : 'text-amber-400'}>{dbMode === 'mongodb' ? 'MongoDB LIVE' : 'In-Memory'}</strong>
                    </span>
                  </div>
                </div>

                {/* Database Connection Alert / Dynamic Troubleshooting tips */}
                {connectionError && (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4.5 space-y-3 font-sans">
                    <div className="flex gap-2.5 items-start">
                      <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400 shrink-0 mt-0.5">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-bold font-display text-amber-300 block">
                          MongoDB Atlas Connection Refused (IP Whitelist Issue)
                        </span>
                        <p className="text-[11px] text-slate-400 leading-normal font-sans">
                          A custom MONGODB_URI is declared, but the connection was blocked by your Atlas cluster. This is typically because the Dynamic IP of the Cloud container or local sandbox is not authorized in your database's access list.
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-850 text-[11px] space-y-2 mt-1">
                      <div className="text-slate-350 font-bold uppercase tracking-wider text-[10px] font-mono flex items-center gap-1.5 text-amber-400">
                        <ServerOff className="w-3.5 h-3.5" />
                        Active Fallback: In-Memory Mode Engaged
                      </div>
                      <p className="text-slate-400 leading-normal">
                        <strong>No action required:</strong> HealthMate has safely launched an automatic offline-fallback system. You can test weight track logs, view meal charts, and fully navigate the platform now. Data is functional but will reset when Sandbox/server restructures.
                      </p>

                      <div className="border-t border-slate-900 pt-2.5 space-y-1.5 mt-2.5">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                          How to whitelist your IP on MongoDB Atlas:
                        </span>
                        <ul className="space-y-1.5 pl-1">
                          <li className="flex items-start gap-1.5 text-slate-400">
                            <CornerDownRight className="w-3 h-3 text-emerald-400 shrink-0 mt-1" />
                            <span>Log in to your <strong>MongoDB Atlas Dashboard</strong>.</span>
                          </li>
                          <li className="flex items-start gap-1.5 text-slate-400">
                            <CornerDownRight className="w-3 h-3 text-emerald-400 shrink-0 mt-1" />
                            <span>Navigate to <strong>Security &gt; Network Access</strong> on the left-hand rail.</span>
                          </li>
                          <li className="flex items-start gap-1.5 text-slate-400">
                            <CornerDownRight className="w-3 h-3 text-emerald-400 shrink-0 mt-1" />
                            <span>Click <strong>Add IP Address</strong> and select or type <code>0.0.0.0/0</code> (this authorizes dynamic secure Cloud Run containers to establish handshakes).</span>
                          </li>
                          <li className="flex items-start gap-1.5 text-slate-400">
                            <CornerDownRight className="w-3 h-3 text-emerald-400 shrink-0 mt-1" />
                            <span>Click <strong>Confirm</strong>. Your Live MongoDB features will begin synchronizing instantly!</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form to submit a new entry */}
                <form onSubmit={handleAddBmiLog} className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850/60 space-y-3">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                    Log Current Measurements
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 uppercase font-mono block">Current Weight (kg)</label>
                      <input 
                        type="number" 
                        step="0.1" 
                        value={newLogWeight}
                        onChange={(e) => setNewLogWeight(e.target.value)}
                        placeholder="e.g. 70.5" 
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 uppercase font-mono block">Current Height (cm)</label>
                      <input 
                        type="number" 
                        step="0.5"
                        value={newLogHeight}
                        onChange={(e) => setNewLogHeight(e.target.value)}
                        placeholder="e.g. 172" 
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <button 
                      type="submit" 
                      className="px-4 py-2 bg-slate-900 hover:bg-emerald-500 hover:text-slate-950 border border-slate-800 hover:border-transparent text-slate-300 text-xs font-display font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Log Measurement
                    </button>

                    {logSubmitStatus && (
                      <span className={`text-[10px] font-mono leading-none ${
                        logSubmitStatus.includes("Error") || logSubmitStatus.includes("failure") ? "text-red-400" : "text-emerald-400"
                      }`}>
                        {logSubmitStatus}
                      </span>
                    )}
                  </div>
                </form>

                {/* Database history logs ledger list */}
                <div className="space-y-3">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                    Historical Log Records Ledger
                  </span>

                  {historyLoading ? (
                    <div className="space-y-2 py-4">
                      <div className="h-10 bg-slate-900/60 rounded-xl animate-pulse" />
                      <div className="h-10 bg-slate-900/60 rounded-xl animate-pulse" />
                      <div className="h-10 bg-slate-900/60 rounded-xl animate-pulse" />
                    </div>
                  ) : bmiHistory.length === 0 ? (
                    <div className="text-center py-8 bg-slate-950/25 rounded-2xl border border-dashed border-slate-900 flex flex-col items-center justify-center">
                      <Calendar className="w-8 h-8 text-slate-700 mb-2" />
                      <span className="text-xs text-slate-500 font-sans">No weight tracking log records available in database yet.</span>
                      <span className="text-[10px] text-slate-650 font-mono mt-1">Submit your parameters above to initialize.</span>
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto pr-1 rounded-2xl border border-slate-900 bg-slate-950/20">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-900 text-slate-500 font-mono text-[9px] uppercase tracking-wider bg-slate-950/50">
                            <th className="py-3 px-4 font-bold">Recorded At</th>
                            <th className="py-3 px-4 font-bold text-center">Weight</th>
                            <th className="py-3 px-4 font-bold text-center">Height</th>
                            <th className="py-3 px-4 font-bold text-center">BMI Score</th>
                            <th className="py-3 px-4 font-bold text-right">Zone</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900 font-mono text-[11px] text-slate-300">
                          {bmiHistory.map((entry) => {
                            // Find color for classification dynamically
                            let badgeStyle = "text-emerald-400 bg-emerald-500/10";
                            if (entry.bmiCategory === "Underweight") badgeStyle = "text-teal-400 bg-teal-500/10";
                            if (entry.bmiCategory === "Overweight") badgeStyle = "text-amber-400 bg-amber-500/10";
                            if (entry.bmiCategory === "Obesity") badgeStyle = "text-red-400 bg-red-400/10";

                            return (
                              <tr key={entry._id || entry.recordedAt} className="hover:bg-slate-900/50 transition-colors">
                                <td className="py-3 px-4 text-slate-400 text-[10px]">
                                  {new Date(entry.recordedAt).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })}
                                </td>
                                <td className="py-3 px-4 text-center text-slate-200 font-bold">{entry.weight} kg</td>
                                <td className="py-3 px-4 text-center text-slate-500">{entry.height} cm</td>
                                <td className="py-3 px-4 text-center font-bold text-slate-200">{entry.bmiValue}</td>
                                <td className="py-3 px-4 text-right">
                                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-sans font-extrabold uppercase tracking-wide inline-block ${badgeStyle}`}>
                                    {entry.bmiCategory}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Mobile navigation bottom bar (Only visible on small devices) */}
      <footer className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-900/90 flex items-center justify-around px-4 pb-[env(safe-area-inset-bottom,0px)] h-[calc(4rem+env(safe-area-inset-bottom,0px))] backdrop-blur-md shadow-lg shadow-black">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center h-full w-full gap-1 text-[10px] transition-colors cursor-pointer ${
            activeTab === 'dashboard' ? 'text-emerald-400 font-semibold' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Compass className="w-5 h-5" />
          Analysis
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`flex flex-col items-center justify-center h-full w-full gap-1 text-[10px] transition-colors cursor-pointer ${
            activeTab === 'search' ? 'text-emerald-400 font-semibold' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Search className="w-5 h-5" />
          Search
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center h-full w-full gap-1 text-[10px] transition-colors cursor-pointer ${
            activeTab === 'profile' ? 'text-emerald-400 font-semibold' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <User className="w-5 h-5" />
          My Stats
        </button>
      </footer>
    </div>
  );
}
