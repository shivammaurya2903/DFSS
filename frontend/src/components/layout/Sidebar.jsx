import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Folder, Users, Star, Clock, 
  HardDrive, Activity, Settings, Cloud, User, 
  ShieldCheck, Server, Microscope, FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const { user } = useAuth();
  
  const mainItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'My Files', icon: Folder, path: '/files' },
    { name: 'Shared', icon: Users, path: '/shared' },
    { name: 'Favorites', icon: Star, path: '/favorites' },
    { name: 'Recent', icon: Clock, path: '/recent' },
  ];

  const storageItems = [
    { name: 'Storage', icon: HardDrive, path: '/storage' },
    { name: 'Activity', icon: Activity, path: '/activity' },
  ];
  
  const accountItems = [
    { name: 'Settings', icon: Settings, path: '/settings' },
    { name: 'Profile', icon: User, path: '/profile' },
  ];

  const adminItems = [
    { name: 'Admin Dashboard', icon: ShieldCheck, path: '/admin' },
    { name: 'Users', icon: Users, path: '/admin/users' },
    { name: 'Nodes', icon: Server, path: '/admin/nodes' },
    { name: 'Storage', icon: HardDrive, path: '/admin/storage' },
    { name: 'Activity', icon: FileText, path: '/admin/activity' },
    { name: 'Research', icon: Microscope, path: '/admin/research' },
    { name: 'Experiments', icon: Microscope, path: '/admin/experiments' },
    { name: 'Audit', icon: FileText, path: '/admin/audit' },
  ];

  const used = user?.usedStorage || 0;
  const quota = user?.storageQuota || (100 * 1024 * 1024);
  const percentage = Math.min(100, Math.round((used / quota) * 100)) || 0;
  
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const NavGroup = ({ title, items }) => (
    <div className="mb-6">
      {title && <div className="mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">{title}</div>}
      <div className="space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={closeSidebar}
            end={item.path === '/admin'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                isActive 
                  ? 'bg-[#f4f2ff] text-[#8178F2]' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-5 h-5 ${isActive ? 'text-[#8178F2]' : 'text-gray-400 group-hover:text-gray-500'}`} />
                {item.name}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-full flex-shrink-0">
      <div className="p-5 flex items-center gap-3 shrink-0">
        <div className="bg-[#8178F2] p-2 rounded-xl shadow-sm shadow-purple-200">
          <Cloud className="text-white w-5 h-5" />
        </div>
        <span className="font-bold text-gray-800 text-xl tracking-tight">DFSS</span>
      </div>

      <nav className="flex-1 px-3 py-2 overflow-y-auto hide-scrollbar">
        <NavGroup items={mainItems} />
        <NavGroup title="Storage & Analytics" items={storageItems} />
        <NavGroup title="Account" items={accountItems} />
        
        {user?.role === 'admin' && (
          <>
            <div className="h-px bg-gray-100 my-4 mx-3"></div>
            <NavGroup title="Admin" items={adminItems} />
          </>
        )}
      </nav>
      
      <div className="p-4 shrink-0">
        <div className="bg-[#F8F9FC] border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700">Storage</span>
            <span className="text-xs text-[#8178F2] font-medium">{percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${percentage > 90 ? 'bg-red-500' : 'bg-[#8178F2]'}`} 
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 font-medium">{formatBytes(used)} of {formatBytes(quota)}</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
