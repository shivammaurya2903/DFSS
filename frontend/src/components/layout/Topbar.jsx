import React, { useState, useEffect, useRef } from 'react';
import { Search, Upload, Menu, X, CheckCircle, AlertTriangle, AlertCircle, File, LogOut, User, Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import * as fileService from '../../services/file.service';
import * as nodeService from '../../services/node.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const Topbar = ({ toggleSidebar }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  
  const [uploadProgress, setUploadProgress] = useState(null);
  const [systemStatus, setSystemStatus] = useState('operational'); // operational, degraded, unavailable
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const fileInputRef = useRef(null);
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);
  const debounceRef = useRef(null);
  
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // System Status Check
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const nodes = await nodeService.getNodes();
        if (!nodes || nodes.length === 0) {
          setSystemStatus('unavailable');
          return;
        }
        const hasDown = nodes.some(n => n.status === 'DOWN');
        const hasDegraded = nodes.some(n => n.status === 'DEGRADED');
        if (hasDown) setSystemStatus('unavailable');
        else if (hasDegraded) setSystemStatus('degraded');
        else setSystemStatus('operational');
      } catch (err) {
        setSystemStatus('unavailable');
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  // Search effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await fileService.getFiles({ search: searchQuery });
        setSearchResults(results.slice(0, 5)); // Limit to 5 results
      } catch (err) {
        console.error("Search error", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    setUploadProgress(0);
    try {
      await fileService.uploadFile(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });
      addToast('File uploaded successfully', 'success');
      setUploadProgress(null);
      // Let pages relying on this know, ideally via context or global state, for now soft reload
      if (window.location.pathname === '/files' || window.location.pathname === '/dashboard') {
         setTimeout(() => window.location.reload(), 1000);
      }
    } catch (err) {
      addToast('Upload failed', 'error');
      setUploadProgress(null);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 z-30 relative">
      <div className="flex items-center gap-4">
        <button 
          className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors" 
          onClick={toggleSidebar}
        >
          <Menu className="w-6 h-6" />
        </button>
        
        {/* Global Search */}
        <div className="relative" ref={searchRef}>
          <div className={`flex items-center bg-[#F8F9FC] border ${showSearchDropdown ? 'border-[#8178F2] ring-2 ring-[#8178F2]/20' : 'border-transparent'} rounded-lg transition-all`}>
            <Search className="w-4 h-4 ml-3 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search files..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearchDropdown(true)}
              className="px-3 py-2 bg-transparent border-none text-sm w-48 sm:w-64 focus:outline-none text-gray-700"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="p-1.5 mr-1 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {showSearchDropdown && searchQuery && (
            <div className="absolute top-full left-0 mt-2 w-full sm:w-[320px] bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
              {isSearching ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">Searching...</div>
              ) : searchResults.length > 0 ? (
                <div>
                  <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase">Files</div>
                  {searchResults.map(result => (
                    <Link 
                      key={result.id || result._id}
                      to={`/files/${result.id || result._id}`}
                      onClick={() => setShowSearchDropdown(false)}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <div className="p-2 bg-[#f4f2ff] text-[#8178F2] rounded-lg">
                        <File className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">{result.filename}</div>
                        <div className="text-xs text-gray-500">{formatBytes(result.size)} • {result.type || 'Unknown'}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">No results found</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        {/* System Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100" title={`System Status: ${systemStatus}`}>
          <div className="relative flex h-2.5 w-2.5">
            {systemStatus === 'operational' && (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </>
            )}
            {systemStatus === 'degraded' && <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>}
            {systemStatus === 'unavailable' && <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>}
          </div>
        </div>

        {/* Upload Button */}
        <div className="flex items-center">
          <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
          {uploadProgress !== null ? (
            <div className="flex items-center gap-3 px-4 py-1.5 bg-[#f4f2ff] rounded-lg border border-purple-100">
              <div className="w-20 sm:w-24 bg-white rounded-full h-1.5 overflow-hidden border border-purple-50">
                <div className="bg-[#8178F2] h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
              </div>
              <span className="text-xs font-semibold text-[#8178F2]">{uploadProgress}%</span>
            </div>
          ) : (
            <button 
              onClick={handleUploadClick}
              className="flex items-center gap-2 px-4 py-2 bg-[#8178F2] text-white rounded-lg hover:bg-[#6c63e6] transition-colors text-sm font-medium shadow-sm shadow-purple-200"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </button>
          )}
        </div>

        <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
        
        {/* User Avatar Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 focus:outline-none p-1 rounded-full hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#f4f2ff] text-[#8178F2] flex items-center justify-center font-bold text-sm border border-purple-100">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
              <div className="px-4 py-3 border-b border-gray-50 mb-1">
                <div className="text-sm font-semibold text-gray-800 truncate">{user?.name || "User"}</div>
                <div className="text-xs text-gray-500 truncate">{user?.email || "user@example.com"}</div>
              </div>
              
              <Link 
                to="/profile" 
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User className="w-4 h-4 text-gray-400" /> Profile
              </Link>
              <Link 
                to="/settings" 
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4 text-gray-400" /> Settings
              </Link>
              
              <div className="h-px bg-gray-50 my-1"></div>
              
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
              >
                <LogOut className="w-4 h-4 text-red-500" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
