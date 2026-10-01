import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Cloud, Eye, EyeOff, Loader2 } from 'lucide-react';
import characterImg from '../assets/character.png';
import { useAuth } from '../context/AuthContext';

const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLogin = location.pathname === '/login';
  const { login, register } = useAuth();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        navigate('/dashboard');
      } else {
        await register(name, email, password);
        navigate('/dashboard');
      }
    } catch (err) {
      alert(isLogin ? 'Login failed' : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    if (isLogin) {
      navigate('/register');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl h-[600px] bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        
        {/* Form Section */}
        <div 
          className={`absolute top-0 left-0 h-full w-full md:w-1/2 flex flex-col justify-center px-8 md:px-12 transition-transform duration-700 ease-in-out z-10 bg-white/5 backdrop-blur-md ${
            isLogin ? 'translate-x-0' : 'translate-x-0 md:translate-x-full'
          }`}
        >
          <div className="flex justify-center mb-6">
            <div className="bg-indigo-600/20 p-3 rounded-2xl border border-indigo-500/30">
              <Cloud className="text-indigo-400 w-8 h-8" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-center text-white mb-2">
            {isLogin ? 'Welcome back to DFSS' : 'Create your DFSS account'}
          </h2>
          <p className="text-gray-500 mb-6 text-sm text-center">
            {isLogin 
              ? 'Securely access your distributed workspace.' 
              : 'Start managing your files with a secure distributed storage experience.'}
          </p>
          <p className="text-center text-indigo-200/60 mb-8 text-sm">
            {isLogin ? 'Sign in to access your DS Cloud' : 'Join DS Cloud and start storing securely'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isLogin ? 'max-h-0 opacity-0' : 'max-h-24 opacity-100'}`}>
              <label className="block text-sm font-medium text-indigo-200 mb-1">Name</label>
              <input 
                type="text" 
                required={!isLogin}
                className="w-full p-3 bg-white/5 border border-indigo-500/20 rounded-xl outline-none focus:border-indigo-500 text-white placeholder-indigo-300/30"
                value={name} 
                onChange={e => setName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-indigo-200 mb-1">Email</label>
              <input 
                type="email" 
                required
                className="w-full p-3 bg-white/5 border border-indigo-500/20 rounded-xl outline-none focus:border-indigo-500 text-white placeholder-indigo-300/30"
                value={email} 
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-indigo-200 mb-1">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  className="w-full p-3 bg-white/5 border border-indigo-500/20 rounded-xl outline-none focus:border-indigo-500 text-white placeholder-indigo-300/30 pr-10"
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-300/50 hover:text-indigo-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex items-center justify-center py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed mt-6 shadow-lg shadow-indigo-500/30"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Authenticating...
                </>
              ) : (
                isLogin ? 'Login' : 'Register'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-indigo-200/60">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button"
              onClick={toggleAuthMode}
              className="text-indigo-400 font-medium hover:text-indigo-300 hover:underline transition-colors"
            >
              {isLogin ? 'Create Account' : 'Login'}
            </button>
          </p>
        </div>

        {/* Visual Section */}
        <div 
          className={`hidden md:flex absolute top-0 left-0 w-1/2 h-full items-center justify-center p-8 transition-transform duration-700 ease-in-out ${
            isLogin ? 'translate-x-full' : 'translate-x-0'
          }`}
        >
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/50 to-transparent rounded-3xl mix-blend-overlay"></div>
            <img 
              src={characterImg} 
              alt="Welcome" 
              className="relative z-10 w-3/4 max-w-sm drop-shadow-[0_0_15px_rgba(99,102,241,0.5)] object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="relative z-10 text-center mt-8">
              <h3 className="text-2xl font-bold text-white mb-2">Secure Cloud Storage</h3>
              <p className="text-indigo-200/80 text-sm max-w-xs">
                Store, share, and manage your files with enterprise-grade security.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthPage;

