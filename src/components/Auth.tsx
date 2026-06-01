import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User, Sparkles, LogIn, UserPlus, Apple, AlertCircle, ArrowLeft } from 'lucide-react';

interface AuthProps {
  onSuccess: (user: any) => void;
  onBack: () => void;
}

export default function Auth({ onSuccess, onBack }: AuthProps) {
  const [isSignup, setIsSignup] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Simple client side basic validation
    if (isSignup && !name.trim()) {
      setErrorMsg("Please enter your name.");
      return;
    }
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Email and password fields are required.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isSignup ? '/api/signup' : '/api/login';
      const bodyPayload = isSignup 
        ? { name, email, password }
        : { email, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
      });

      const resJson = await response.json();

      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error || "Authentication step failed. Please verify credentials.");
      }

      // Success callback
      onSuccess(resJson.data);
    } catch (err: any) {
      setErrorMsg(err.message || "Could not connect to healthmate auth server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 px-6 py-12 overflow-hidden selection:bg-emerald-500/30">
      {/* Background Decorative Glow */}
      <div className="absolute top-[-10%] right-[-10%] w-[350px] h-[350px] rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[350px] h-[350px] rounded-full bg-teal-500/5 blur-[100px] pointer-events-none" />

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md z-10 bg-slate-900/60 border border-slate-800/80 p-8 rounded-3xl space-y-6 shadow-2xl relative"
      >
        {/* Back navigation button */}
        <button
          onClick={onBack}
          className="absolute left-6 top-6 text-slate-500 hover:text-slate-350 cursor-pointer transition-colors p-1 rounded-lg hover:bg-slate-950/40"
          title="Return to Splash Screen"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Logo and Identity */}
        <div className="text-center pt-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/10 mx-auto mb-3">
            <Apple className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <h2 className="font-display font-black text-2xl tracking-wide bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
            HEALTHMATE
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-widest font-bold">
            {isSignup ? "Create Secure Account" : "Registered User Log In"}
          </p>
        </div>

        {/* Alert container */}
        {errorMsg && (
          <div className="flex gap-2.5 items-start p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-sans leading-normal">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Register-only field */}
          {isSignup && (
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-mono tracking-wider block">Your Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-emerald-500/50 rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono text-slate-100 placeholder:text-slate-650 focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* Email address field */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 uppercase font-mono tracking-wider block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@domain.com"
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-emerald-500/50 rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono text-slate-100 placeholder:text-slate-650 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Secure passcode field */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 uppercase font-mono tracking-wider block">Secret Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-emerald-500/50 rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono text-slate-100 placeholder:text-slate-650 focus:outline-none transition-all"
              />
            </div>
            <span className="text-[9px] text-slate-600 font-mono block text-right pt-0.5">
              Minimum length of 6 characters
            </span>
          </div>

          {/* Button submission */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-display font-bold rounded-xl shadow-xl shadow-emerald-950/30 hover:shadow-emerald-500/10 transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs disabled:opacity-50"
          >
            {isLoading ? (
              <span className="animate-pulse">Authorizing credentials...</span>
            ) : isSignup ? (
              <>
                <UserPlus className="w-4 h-4 text-slate-950" />
                Register Account
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 text-slate-950" />
                Sign In to Platform
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center border-t border-slate-850 pt-4">
          <p className="text-[11px] text-slate-500">
            {isSignup ? "Already have an account?" : "Need a private account?"}{' '}
            <button
              onClick={() => {
                setIsSignup(!isSignup);
                setErrorMsg(null);
              }}
              className="font-bold text-emerald-400 hover:text-emerald-350 bg-transparent border-none p-0 cursor-pointer font-display transition-colors ml-1"
            >
              {isSignup ? "Sign In Here" : "Register For Free"}
            </button>
          </p>
        </div>

        {/* Dynamic credentials note */}
        <div className="flex justify-center items-center gap-1.5 text-[9px] text-slate-600 font-mono">
          <Sparkles className="w-3 h-3 text-emerald-400/60" />
          <span>No social logins • Data fully insulated per user account.</span>
        </div>
      </motion.div>
    </div>
  );
}
