/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Sparkles, AlertCircle, Apple, Flame, ChevronRight } from 'lucide-react';
import { FoodItem, BMIClassification } from '../types';
import { FOODS_DATABASE } from '../data/foods';
import FoodIntelCard from './FoodIntelCard';

interface FoodSearchProps {
  bmiClassification: BMIClassification;
  userAge: number;
  activityLevel: 'sedentary' | 'moderate' | 'active';
  userGender?: 'male' | 'female' | 'other';
}

// Low-overhead Levenshtein distance calculator for intelligent phonetic/spelling approximation
function getLevenshteinDistance(s1: string, s2: string): number {
  if (s1.length < s2.length) {
    return getLevenshteinDistance(s2, s1);
  }
  if (s2.length === 0) {
    return s1.length;
  }
  let previousRow = Array.from({ length: s2.length + 1 }, (_, i) => i);
  for (let i = 0; i < s1.length; i++) {
    const currentRow = [i + 1];
    for (let j = 0; j < s2.length; j++) {
      const insertions = previousRow[j + 1] + 1;
      const deletions = currentRow[j] + 1;
      const substitutions = previousRow[j] + (s1[i] === s2[j] ? 0 : 1);
      currentRow.push(Math.min(insertions, deletions, substitutions));
    }
    previousRow = currentRow;
  }
  return previousRow[previousRow.length - 1];
}

export default function FoodSearch({ bmiClassification, userAge, activityLevel, userGender }: FoodSearchProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);

  // Live API-backed food states
  const [apiFoods, setApiFoods] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch from our multi-user live backend food-search endpoint (powered by Gemini API)
  const triggerApiSearch = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) {
      setApiFoods([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setApiError(null);
    try {
      const response = await fetch('/api/food-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: trimmed })
      });
      if (!response.ok) {
        throw new Error('Server returned an error');
      }
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setApiFoods(result.data);
      } else {
        setApiFoods([]);
      }
    } catch (err: any) {
      console.warn("API food search failed. Falling back to local static lookup database gracefully.", err);
      setApiError(err.message || 'Connection failure');
      setApiFoods([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search trigger for high-frequency typing performance
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setApiFoods([]);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      triggerApiSearch(searchQuery);
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Derive static categories list from BOTH local database and live loaded items
  const categories = useMemo(() => {
    const allItems = [...FOODS_DATABASE, ...apiFoods];
    const list = new Set(allItems.map(f => f.category));
    return ['All', ...Array.from(list)];
  }, [apiFoods]);

  // Multi-dimensional smart query filter (integrates both live API items and local static database fallbacks)
  const filteredFoods = useMemo(() => {
    // If we have search inputs with active API loaded items, respect the live response
    if (searchQuery.trim().length >= 2 && apiFoods.length > 0) {
      if (selectedCategory !== 'All') {
        return apiFoods.filter(f => f.category === selectedCategory);
      }
      return apiFoods;
    }

    let result = FOODS_DATABASE;

    if (selectedCategory !== 'All') {
      result = result.filter(f => f.category === selectedCategory);
    }

    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase().trim();

      // Check for macro queries
      if (query === 'protein' || query === 'high protein' || query === 'high-protein') {
        return result.filter(f => f.macros.protein >= 12);
      }
      if (query === 'low fat' || query === 'low-fat') {
        return result.filter(f => f.macros.fat <= 3);
      }
      if (query === 'low carb' || query === 'low-carb' || query === 'keto') {
        return result.filter(f => f.macros.carbs <= 10);
      }
      if (query === 'high carb' || query === 'high-carb') {
        return result.filter(f => f.macros.carbs >= 40);
      }
      if (query === 'fiber' || query === 'high fiber' || query === 'soluble fiber') {
        return result.filter(f => f.description.toLowerCase().includes('fiber') || f.description.toLowerCase().includes('beta-glucan'));
      }

      // Default string match
      result = result.filter(f => 
        f.name.toLowerCase().includes(query) || 
        f.category.toLowerCase().includes(query) ||
        f.description.toLowerCase().includes(query)
      );
    }

    return result;
  }, [searchQuery, selectedCategory, apiFoods]);

  // Compute fuzzy match recommendations when the active search yields 0 items
  const spellingSuggestions = useMemo(() => {
    if (filteredFoods.length > 0 || !searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    
    const candidates = FOODS_DATABASE.map(food => {
      let score = 0;
      const foodName = food.name.toLowerCase();
      
      if (foodName.includes(query) || query.includes(foodName)) {
        score += 8;
      }
      
      const queryLetters = new Set(query.split(''));
      let matchedLetters = 0;
      for (const char of foodName) {
        if (queryLetters.has(char)) matchedLetters++;
      }
      score += (matchedLetters / Math.max(1, query.length)) * 4;
      
      // Calculate Levenshtein distance on starts
      const distance = getLevenshteinDistance(query.slice(0, 10), foodName.slice(0, 10));
      score -= distance * 1.5;

      return { food, score };
    });

    return candidates
      .filter(c => c.score > -10)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(c => c.food);
  }, [filteredFoods.length, searchQuery]);

  // Dynamic filtered search output statistics (Realism metadata helper)
  const filterStats = useMemo(() => {
    if (filteredFoods.length === 0) return null;
    const totalCalories = filteredFoods.reduce((acc, f) => acc + f.calories, 0);
    const avgCalories = Math.round(totalCalories / filteredFoods.length);
    const avgProtein = parseFloat((filteredFoods.reduce((acc, f) => acc + f.macros.protein, 0) / filteredFoods.length).toFixed(1));
    return {
      avgCalories,
      avgProtein,
      count: filteredFoods.length,
    };
  }, [filteredFoods]);

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    // Smooth scrolling to details card
    setTimeout(() => {
      document.getElementById('food-intel-card-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  // Profile-Adaptive popular suggestion directives (highly personalized depending on user's active BMI classification)
  const POPULAR_SUGGESTIONS = useMemo(() => {
    if (bmiClassification === 'Obesity' || bmiClassification === 'Overweight') {
      return [
        { label: 'Organic Green Tea', id: 'green_tea' },
        { label: 'Low-Fat Greek Yogurt', id: 'greek_yogurt' },
        { label: 'Garlic Steamed Broccoli', id: 'broccoli' },
        { label: 'Yellow Dal Tadka', id: 'dal_tadka' },
        { label: 'Pan-Seared Salmon', id: 'salmon' },
        { label: 'Superfood Quinoa Bowl', id: 'quinoa_bowl' }
      ];
    } else if (bmiClassification === 'Underweight') {
      return [
        { label: 'Fresh Creamy Avocado', id: 'creamy_avocado' },
        { label: 'Classic Cheeseburger', id: 'burger' },
        { label: 'Spiced Paneer Tikka', id: 'paneer_tikka' },
        { label: 'Premium Whey Shake', id: 'whey_protein' },
        { label: 'Chicken Biryani', id: 'chicken_biryani' },
        { label: 'Boiled Eggs', id: 'boiled_eggs' }
      ];
    } else {
      return [
        { label: 'Steamed Idli', id: 'idli' },
        { label: 'Dynamic Oats Oatmeal', id: 'oatmeal' },
        { label: 'Fresh Creamy Avocado', id: 'creamy_avocado' },
        { label: 'Boiled Eggs', id: 'boiled_eggs' },
        { label: 'Delicate Palak Paneer', id: 'palak_paneer' },
        { label: 'Plain Masala Dosa', id: 'dosa' }
      ];
    }
  }, [bmiClassification]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/40 border border-slate-800/80 p-5 md:p-6 rounded-3xl backdrop-blur-md">
        <div className="flex items-center gap-1.5 text-xs font-bold font-mono tracking-wider text-emerald-400 uppercase mb-2">
          <Sparkles className="w-4 h-4" />
          Intel search & dynamic spell assistance
        </div>
        <h3 id="search-title" className="font-display text-xl font-bold text-slate-100">
          Analyze Food Intelligence
        </h3>
        <p className="text-xs text-slate-400 mt-1 leading-normal max-w-lg mb-4">
          Type foods or try macro filters like <span className="text-emerald-400 font-mono font-semibold">"high protein"</span>, <span className="text-emerald-400 font-mono font-semibold">"low fat"</span>, or <span className="text-emerald-400 font-mono font-semibold">"keto"</span> to analyze live parameters parsed for your profile. 
        </p>

        {/* Search Input field */}
        <div className="relative mb-5">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500">
            <Search className="w-5 h-5" />
          </div>
          <input
            id="food-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search noodles, avocado, eggs, shake, high protein..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-sans transition-all focus:ring-1 focus:ring-emerald-500/20"
          />
          {searchQuery && (
            <button
              id="clear-search-btn"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-4 flex items-center text-slate-500 hover:text-slate-300 px-1 text-xs font-mono font-bold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Profile-Tailored Suggestions */}
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            DIRECTIVES TAILORED FOR YOUR {bmiClassification.toUpperCase()} PROFILE:
          </div>
          <div id="tailored-suggestion-container" className="flex flex-wrap gap-2">
            {POPULAR_SUGGESTIONS.map((s) => {
              const item = FOODS_DATABASE.find(f => f.id === s.id);
              return (
                <button
                  id={`suggest-${s.id}`}
                  key={s.id}
                  onClick={() => item && handleSelectFood(item)}
                  className="px-3 py-1.5 rounded-full border border-slate-800/80 bg-slate-950/50 hover:bg-slate-900 hover:border-slate-700 text-xs font-medium text-slate-300 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Apple className="w-3 h-3 text-emerald-500/80" />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Grid: Search results on left, Food Intelligence card on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Results & Category Filters (occupies 5 columns on desktop) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Category Filter Pills & Insights counter */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 px-1 overflow-x-auto pb-1 max-w-full no-scrollbar">
              {categories.map((cat) => (
                <button
                  id={`cat-filter-${cat.replace(/\s+/g, '-').toLowerCase()}`}
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`py-1.5 px-3 rounded-full text-xs font-medium border whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 font-semibold'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Smart stats display for food search realism */}
            {filterStats && (
              <div id="search-statistics-bar" className="flex items-center justify-between text-[10px] font-mono font-semibold bg-slate-900/20 border border-slate-900 rounded-xl px-3 py-1 text-slate-400">
                <span>{filterStats.count} items matches found</span>
                <span className="text-emerald-400/90">Avg: {filterStats.avgCalories} kCal • P: {filterStats.avgProtein}g</span>
              </div>
            )}
          </div>

          {/* List items holding foods */}
          <div className="bg-slate-905 border border-slate-850 rounded-3xl overflow-hidden max-h-[460px] overflow-y-auto pr-1">
            {isLoading ? (
              <div id="searching-loader-indicator" className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-4 bg-slate-900/5">
                <div className="relative w-8 h-8">
                  <div className="absolute top-0 left-0 w-full h-full rounded-full border-2 border-slate-800/40 animate-pulse" />
                  <div className="absolute top-0 left-0 w-full h-full rounded-full border-2 border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                </div>
                <div className="space-y-1">
                  <p className="font-mono text-[10px] text-emerald-400/90 tracking-widest uppercase animate-pulse">Retrieving Nutrition Profiles</p>
                  <p className="text-[9px] text-slate-500 font-medium">Querying live biochemist index with Gemini AI...</p>
                </div>
              </div>
            ) : filteredFoods.length > 0 ? (
              <div id="food-results-list" className="divide-y divide-slate-900">
                {filteredFoods.map((food) => {
                  const isCurrentlySelected = selectedFood?.id === food.id;
                  let badgeColor = 'bg-yellow-500/10 text-yellow-500';
                  if (food.baseRecommendation === 'Can Eat') {
                    badgeColor = 'bg-emerald-500/10 text-emerald-400';
                  } else if (food.baseRecommendation === 'Avoid') {
                    badgeColor = 'bg-red-500/10 text-red-500';
                  }

                  return (
                    <button
                      id={`food-result-item-${food.id}`}
                      key={food.id}
                      onClick={() => handleSelectFood(food)}
                      className={`w-full text-left p-3.5 flex items-center justify-between transition-all cursor-pointer focus:outline-none ${
                        isCurrentlySelected 
                          ? 'bg-slate-900/80 border-l-2 border-emerald-500 pl-2.5' 
                          : 'hover:bg-slate-900/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-800">
                          <img
                            src={food.image}
                            alt={food.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="text-xs md:text-sm font-semibold text-slate-200 tracking-tight flex items-center gap-1.5">
                            {food.name}
                            {isCurrentlySelected && <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono text-slate-400">
                              {food.calories} kCal
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-850" />
                            <span className="text-[10px] font-mono text-slate-500">
                              P: {food.macros.protein}g • F: {food.macros.fat}g • C: {food.macros.carbs}g
                            </span>
                          </div>
                        </div>
                      </div>

                      <span className={`text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-md font-bold shrink-0 text-center ${badgeColor}`}>
                        {food.baseRecommendation === 'Can Eat' ? 'EAT' : food.baseRecommendation === 'Occasional' ? 'LIMIT' : 'AVOID'}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div id="empty-search-state" className="p-8 text-center text-slate-500 text-xs flex flex-col items-center gap-3 bg-slate-900/5">
                <AlertCircle className="w-7 h-7 text-slate-600" />
                <div>
                  <p className="font-semibold text-slate-400">No exact parameters located.</p>
                  <p className="text-[10px] text-slate-500 mt-1">Try another keyword or search term.</p>
                </div>

                {/* Spell Assistance Heuristic rendering */}
                {spellingSuggestions.length > 0 && (
                  <div id="spellchecker-suggestions-panel" className="mt-3 p-3 bg-slate-950/60 rounded-2xl border border-slate-900 w-full text-left space-y-2">
                    <p className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Did you mean?</p>
                    <div className="flex flex-col gap-1.5">
                      {spellingSuggestions.map(food => (
                        <button
                          id={`spellcheck-suggest-${food.id}`}
                          key={food.id}
                          onClick={() => {
                            setSearchQuery(food.name);
                            handleSelectFood(food);
                          }}
                          className="flex items-center justify-between text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-slate-900/60 p-1.5 rounded-xl transition-colors w-full text-left cursor-pointer"
                        >
                          <span>{food.name}</span>
                          <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">{food.category}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  id="reset-search-btn"
                  onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                  className="text-emerald-500 hover:text-emerald-400 underline font-mono text-[10px] mt-2 cursor-pointer"
                >
                  Reset all query filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: The details card anchor (occupies 7 columns on desktop) */}
        <div id="food-intel-card-anchor" className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {selectedFood ? (
              <motion.div 
                key={selectedFood.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <FoodIntelCard
                  food={selectedFood as FoodItem}
                  bmiClassification={bmiClassification}
                  userAge={userAge}
                  activityLevel={activityLevel}
                  userGender={userGender}
                  onClose={() => setSelectedFood(null)}
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-[380px] rounded-3xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-center p-6 bg-slate-900/10"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3">
                  <Apple className="w-5 h-5 text-emerald-400 animate-pulse" />
                </div>
                <h4 className="font-display font-bold text-slate-300">Food Intel Desk</h4>
                <p className="text-xs text-slate-500 max-w-xs mt-1.5 leading-relaxed font-sans">
                  Select any food item from the list or complete the search prompt above to instantly build a personalized nutritional breakdown warning card.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
