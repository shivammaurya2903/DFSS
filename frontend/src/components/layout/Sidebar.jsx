import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Folder, Users, Star, Clock, Trash2, HardDrive, Activity, Settings, Cloud } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'My Files', icon: Folder, path: '/' },
    { name: 'Shared With Me', icon: Users, path: '/shared' },
    { name: 'Favorites', icon: Star, path: '/favorites' },
    { name: 'Recent', icon: Clock, path: '/recent' },
    { name: 'Expired Files', icon: Trash2, path: '/expired' },
  ];

  const sysItems = [
    { name: 'Storage', icon: HardDrive, path: '/storage' },
    { name: 'Activity', icon: Activity, path: '/activity' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-full flex-shrink-0">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-purple-600 p-2 rounded-lg">
          <Cloud className="text-white w-5 h-5" />
        </div>
        <span className="font-bold text-gray-800 text-lg">DS Cloud</span>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        <div className="mb-4 text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">Main</div>
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                isActive ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-5 h-5 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} />
                {item.name}
              </>
            )}
          </NavLink>
        ))}

        <div className="mt-8 mb-4 text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">System</div>
        {sysItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                isActive ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-5 h-5 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} />
                {item.name}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-gray-100">
        <div className="bg-purple-50 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700">Storage</span>
            <span className="text-xs text-purple-600 font-medium">82%</span>
          </div>
          <div className="w-full bg-purple-200 rounded-full h-1.5 mb-2">
            <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: '82%' }}></div>
          </div>
          <div className="text-xs text-gray-500">824 GB of 1 TB used</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

