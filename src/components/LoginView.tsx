import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Lock, Mail, Server } from 'lucide-react';

export default function LoginView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setUser, setError } = useStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // In this production-ready prototype, any valid email format works
    // and password must be at least 6 chars. 
    // In a real DB sync, this would call /api/login
    try {
      if (email.includes('@') && password.length >= 6) {
        // Simulate network lag
        await new Promise(r => setTimeout(r, 800));
        
        const mockUser = {
          id: 'admin-01',
          email,
          role: 'ADMIN',
          full_name: 'System Operator'
        };
        
        setUser(mockUser);
        localStorage.setItem('omni_user', JSON.stringify(mockUser));
      } else {
        setError('Invalid credentials. Please use a valid email and 6+ char password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 selection:bg-emerald-500/30">
      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-6">
            <Server className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">OmniESL Cloud</h1>
          <p className="text-zinc-500 text-sm">Industrial Command Center v2.1</p>
        </div>

        {/* Login Card */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl backdrop-blur-xl shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 px-1">
                Operator Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@omniesl.io"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 px-1">
                Secret Access Key
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-700"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 group"
            >
              {isLoading ? 'Decrypting Access...' : 'Connect to Infrastructure'}
              {!isLoading && <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse group-hover:scale-125 transition-transform" />}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-zinc-600 text-[10px] uppercase tracking-widest">
          Hardware Security Module Enabled • AES-256 Encrypted
        </p>
      </div>
    </div>
  );
}
