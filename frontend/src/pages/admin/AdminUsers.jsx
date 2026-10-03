import React, { useState, useEffect } from 'react';
import { Users, HardDrive, ShieldCheck, Mail, Calendar } from 'lucide-react';
import * as userService from '../../services/user.service';
import { useToast } from '../../context/ToastContext';
import { formatBytes, formatRelativeTime } from '../../utils/formatters';
import PageContainer from '../../components/layout/PageContainer';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await userService.getUsers();
        setUsers(data?.data || []);
      } catch (err) {
        addToast('Failed to load users', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [addToast]);

  return (
    <PageContainer>
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-6 h-6 text-[#8178F2]" />
        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Storage Used</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">Loading users...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">No users found.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#f4f2ff] text-[#8178F2] flex items-center justify-center font-bold">
                          {user.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{user.name}</p>
                          <div className="flex items-center text-xs text-gray-500 mt-0.5">
                            <Mail className="w-3 h-3 mr-1" /> {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        {user.role === 'admin' && <ShieldCheck className="w-3 h-3 mr-1" />}
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-800">
                          {formatBytes(user.usedStorage || 0)} / {formatBytes(user.storageQuota)}
                        </span>
                        <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
                          <div 
                            className="h-full bg-[#8178F2]"
                            style={{ width: `${Math.min(100, ((user.usedStorage || 0) / user.storageQuota) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatRelativeTime(user.createdAt)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
};

export default AdminUsers;
