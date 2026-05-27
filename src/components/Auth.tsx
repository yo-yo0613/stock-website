import { useState } from 'react';
import { apiFetch, setAuthToken } from '../lib/api';
import { motion } from 'framer-motion';
import { Lock, Mail, ChevronRight, AlertCircle } from 'lucide-react';

export const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const endpoint = '/auth.php';
      const body = {
        action: isSignUp ? 'register' : 'login',
        email,
        password
      };

      const data = await apiFetch(endpoint, {
        method: 'POST',
        body
      });

      if (isSignUp) {
        setMessage('Registration successful! You can now sign in.');
        setIsSignUp(false);
      } else {
        if (data.token) {
          setAuthToken(data.token);
          // Reload the page to let UserContext fetch profile
          window.location.reload();
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 selection:bg-primary/30 font-sans text-white relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 blur-[128px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 blur-[128px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6 shadow-lg shadow-primary/20">
            Q
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">QuantTrd</h1>
          <p className="text-muted-foreground">Professional Financial Analytics</p>
        </div>

        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold mb-6 text-foreground text-center">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>

          {import.meta.env.VITE_API_URL === undefined && (
            <div className="bg-blue-500/10 border border-blue-500/50 text-blue-400 p-4 rounded-xl text-sm flex items-start gap-2 mb-6">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div>
                <strong className="block mb-1">Local Testing Mode</strong>
                Connecting to local backend by default. For production, set `VITE_API_URL`.
              </div>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl text-sm flex items-start gap-2">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {message && (
              <div className="bg-green-500/10 border border-green-500/50 text-green-500 p-3 rounded-xl text-sm">
                <p>{message}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-background border border-border focus:border-primary/50 text-foreground rounded-xl py-3 pl-10 pr-4 outline-none transition-colors"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-background border border-border focus:border-primary/50 text-foreground rounded-xl py-3 pl-10 pr-4 outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl mt-4 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Authenticating...' : (isSignUp ? 'Sign Up' : 'Secure Login')}
              {!loading && <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button 
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null); }}
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
