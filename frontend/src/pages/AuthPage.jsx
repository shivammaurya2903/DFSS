import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Cloud, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import characterImg from '../assets/character.png';
import { useAuth } from '../context/AuthContext';

const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLogin = location.pathname === '/login';
  const { login, register } = useAuth();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!isLogin && name.trim().length === 0) {
        setErrorMsg('Name is required.');
        return;
    }
    if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setErrorMsg(err.response.data.message);
      } else {
        setErrorMsg('Unable to connect to the server. Please try again.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setErrorMsg('');
    if (isLogin) {
      navigate('/register');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 font-sans text-[#0f172a]">
      <div className="relative w-full max-w-4xl h-[600px] bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row">
        
        {/* Form Section */}
        <div 
          className={`absolute top-0 left-0 h-full w-full md:w-1/2 flex flex-col justify-center px-8 md:px-12 transition-transform duration-700 ease-in-out z-10 bg-white ${
            isLogin ? 'translate-x-0' : 'translate-x-0 md:translate-x-full'
          }`}
        >
          <div className="flex justify-center mb-6">
            <div className="bg-[#EEEAFD] p-3 rounded-2xl border border-purple-100">
              <Cloud className="text-[#8178F2] w-8 h-8" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
            {isLogin ? 'Welcome back to DFSS' : 'Create your DFSS account'}
          </h2>
          <p className="text-gray-500 mb-6 text-sm text-center">
            {isLogin 
              ? 'Securely access your distributed storage workspace.' 
              : 'Start managing your files through a secure distributed storage experience.'}
          </p>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-red-600 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isLogin ? 'max-h-0 opacity-0' : 'max-h-24 opacity-100'}`}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input 
                type="text" 
                required={!isLogin}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#8178F2] focus:ring-1 focus:ring-[#8178F2] text-gray-800 placeholder-gray-400 transition-shadow"
                value={name} 
                onChange={e => setName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                required
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#8178F2] focus:ring-1 focus:ring-[#8178F2] text-gray-800 placeholder-gray-400 transition-shadow"
                value={email} 
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#8178F2] focus:ring-1 focus:ring-[#8178F2] text-gray-800 placeholder-gray-400 transition-shadow pr-10"
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex items-center justify-center py-2.5 px-4 bg-[#8178F2] hover:bg-[#6c63e6] text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed mt-6 shadow-sm shadow-[#8178F2]/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button"
              onClick={toggleAuthMode}
              className="text-[#8178F2] font-medium hover:text-[#6c63e6] hover:underline transition-colors"
            >
              {isLogin ? 'Create Account' : 'Sign In'}
            </button>
          </p>
        </div>

        {/* Visual Section */}
        <div 
          className={`hidden md:flex absolute top-0 left-0 w-1/2 h-full items-center justify-center p-8 transition-transform duration-700 ease-in-out bg-[#F8F9FC] ${
            isLogin ? 'translate-x-full' : 'translate-x-0'
          }`}
        >
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-[#EEEAFD]/50 to-transparent rounded-3xl mix-blend-multiply"></div>
            
            {/* Decorative shapes */}
            <div className="absolute top-10 right-10 w-24 h-24 bg-[#8178F2]/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-10 left-10 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl"></div>
            
            <img 
              src={characterImg} 
              alt="DFSS authentication illustration" 
              className="relative z-10 w-4/5 max-w-[320px] object-contain drop-shadow-xl animate-[floating_4s_ease-in-out_infinite]"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
              style={{
                animation: 'floating 4s ease-in-out infinite'
              }}
            />
            <style>{`
              @keyframes floating {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
              }
            `}</style>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthPage;
