import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Cloud, Eye, EyeOff, Loader2, AlertCircle, Lock, HardDrive, Shield, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const getPasswordStrength = (pwd) => {
  if (!pwd) return null;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { label: 'Weak', color: '#E88B8B', width: '25%' };
  if (score <= 2) return { label: 'Fair', color: '#E9B85D', width: '50%' };
  if (score <= 3) return { label: 'Good', color: '#69B38A', width: '75%' };
  return { label: 'Strong', color: '#8178F2', width: '100%' };
};

const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLogin = location.pathname === '/login';
  const { login, register } = useAuth();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
    if (!isLogin && password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      const searchParams = new URLSearchParams(location.search);
      const redirectUrl = searchParams.get('redirect') || '/dashboard';
      navigate(redirectUrl, { replace: true });
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

  const pwdStrength = getPasswordStrength(password);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 font-sans text-[#0f172a]">
      <div className="relative w-full max-w-5xl bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row min-h-[650px]">
        
        {/* Form Section */}
        <div 
          className={`w-full md:w-1/2 flex flex-col justify-center px-8 md:px-12 py-10 z-10 bg-white transition-all order-2 md:order-none`}
        >
          <div className="flex justify-between items-center mb-8">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="bg-[#EEEAFD] p-2 rounded-xl border border-purple-100">
                <Cloud className="text-[#8178F2] w-6 h-6" />
              </div>
              <span className="font-bold text-xl tracking-tight text-gray-800">DFSS</span>
            </Link>
            <Link to="/" className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
              Back to Home
            </Link>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-gray-500 mb-8 text-sm">
            {isLogin 
              ? 'Sign in to access your secure distributed file storage.' 
              : 'Start storing your files securely across distributed storage nodes.'}
          </p>

          {errorMsg && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-red-600 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#8178F2] focus:ring-1 focus:ring-[#8178F2] text-gray-800 placeholder-gray-400 transition-shadow"
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
            )}
            
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
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {!isLogin && pwdStrength && (
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">Password strength</span>
                    <span className="text-xs font-medium" style={{ color: pwdStrength.color }}>{pwdStrength.label}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-300" 
                      style={{ width: pwdStrength.width, backgroundColor: pwdStrength.color }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {!isLogin && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    required
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#8178F2] focus:ring-1 focus:ring-[#8178F2] text-gray-800 placeholder-gray-400 transition-shadow pr-10"
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

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

          <p className="mt-8 text-center text-sm text-gray-500">
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
        <div className="w-full md:w-1/2 bg-[#F5F7FB] p-8 flex flex-col items-center justify-center relative overflow-hidden order-1 md:order-none min-h-[300px] border-b md:border-b-0 md:border-l border-gray-100">
          
          <div className="absolute inset-0 bg-gradient-to-br from-[#8178F2]/5 to-transparent"></div>
          
          <div className="relative z-10 w-full max-w-sm">
            {/* Distributed Storage Visualization */}
            <div className="flex flex-col items-center gap-4 mb-10">
              
              {/* User/File */}
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-purple-100 flex items-center gap-3 w-48 justify-center">
                <div className="bg-purple-50 p-2 rounded-lg">
                  <Lock className="w-5 h-5 text-[#8178F2]" />
                </div>
                <span className="font-medium text-sm text-gray-700">Encrypted File</span>
              </div>
              
              <div className="w-0.5 h-6 bg-purple-200 rounded-full animate-pulse"></div>
              
              {/* Chunks */}
              <div className="flex gap-2 p-3 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200 w-full justify-center">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 bg-white rounded-lg shadow-sm border border-purple-100 flex items-center justify-center text-xs font-bold text-[#8178F2]">
                    C{i}
                  </div>
                ))}
              </div>
              
              <div className="flex w-full justify-between px-8 relative">
                <div className="w-[2px] h-10 bg-purple-200 rounded-full absolute left-12 top-0 rotate-[20deg] origin-top animate-pulse" style={{ animationDelay: '200ms' }}></div>
                <div className="w-[2px] h-10 bg-purple-200 rounded-full absolute left-1/2 top-0 -translate-x-1/2 animate-pulse" style={{ animationDelay: '400ms' }}></div>
                <div className="w-[2px] h-10 bg-purple-200 rounded-full absolute right-12 top-0 -rotate-[20deg] origin-top animate-pulse" style={{ animationDelay: '600ms' }}></div>
              </div>
              
              {/* Storage Nodes */}
              <div className="flex gap-4 w-full justify-center mt-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center gap-2">
                    <HardDrive className="w-6 h-6 text-gray-400" />
                    <span className="text-[10px] font-medium text-gray-500">Node {i}</span>
                  </div>
                ))}
              </div>
              
            </div>

            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Secure. Distributed. Reliable.</h3>
              <p className="text-sm text-gray-500">Your files are encrypted, split into chunks, and distributed across a decentralized network.</p>
            </div>

            {!isLogin && (
              <div className="mt-8 grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-start gap-2 shadow-sm">
                  <Cloud className="w-4 h-4 text-[#8178F2] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-gray-700">100 MB</div>
                    <div className="text-[10px] text-gray-500">Free encrypted storage</div>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-start gap-2 shadow-sm">
                  <Shield className="w-4 h-4 text-[#8178F2] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-gray-700">Secure sharing</div>
                    <div className="text-[10px] text-gray-500">Time-limited access</div>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-start gap-2 shadow-sm">
                  <CheckCircle className="w-4 h-4 text-[#8178F2] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-gray-700">Auto compression</div>
                    <div className="text-[10px] text-gray-500">Save space instantly</div>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-start gap-2 shadow-sm">
                  <Lock className="w-4 h-4 text-[#8178F2] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-gray-700">SHA-256</div>
                    <div className="text-[10px] text-gray-500">Integrity verification</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthPage;
