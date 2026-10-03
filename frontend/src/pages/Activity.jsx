import React, { useState, useEffect } from 'react';
import PageContainer from '../components/layout/PageContainer';
import * as activityService from '../services/activity.service';
import { Activity as ActivityIcon, Upload, Download, Eye, Share2, Trash2 } from 'lucide-react';
import { formatRelativeTime } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

const ActionIcon = ({ action }) => {
  const actLower = action.toLowerCase();
  if (actLower.includes('upload')) return <Upload className="w-4 h-4 text-[#69B38A]" />;
  if (actLower.includes('download')) return <Download className="w-4 h-4 text-blue-500" />;
  if (actLower.includes('view')) return <Eye className="w-4 h-4 text-[#8178F2]" />;
  if (actLower.includes('share')) return <Share2 className="w-4 h-4 text-[#E9B85D]" />;
  if (actLower.includes('delete')) return <Trash2 className="w-4 h-4 text-[#E88B8B]" />;
  return <ActivityIcon className="w-4 h-4 text-gray-400" />;
};

const Activity = () => {
  const { addToast } = useToast();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  const filters = ['All', 'Upload', 'Download', 'View', 'Share', 'Delete'];

  useEffect(() => {
    const controller = new AbortController();
    
    const loadActivities = async () => {
      try {
        setLoading(true);
        const result = await activityService.getActivity({ signal: controller.signal });
        const data = result?.data || [];
        setActivities(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name !== 'CanceledError') {
          addToast('Failed to load activity log', 'error');
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadActivities();
    
    return () => controller.abort();
  }, [addToast]);

  const filteredActivities = activities.filter(act => {
    if (filter === 'All') return true;
    return act.action?.toLowerCase().includes(filter.toLowerCase());
  });

  const groupActivitiesByDate = (acts) => {
    const groups = {};
    acts.forEach(act => {
      const dateObj = new Date(act.createdAt || act.date);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let groupKey = dateObj.toLocaleDateString();
      if (dateObj.toDateString() === today.toDateString()) groupKey = 'Today';
      else if (dateObj.toDateString() === yesterday.toDateString()) groupKey = 'Yesterday';

      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(act);
    });
    return groups;
  };

  const groupedActivities = groupActivitiesByDate(filteredActivities);

  return (
    <PageContainer>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#17181C]">Activity Log</h1>
        <p className="text-[#6F737D] text-sm mt-1">Review important activity across your storage account.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f 
                ? 'bg-[#8178F2] text-white' 
                : 'bg-white text-[#6F737D] border border-[#E7E9EF] hover:bg-[#F5F7FB]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      
      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse flex gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 py-2">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : Object.keys(groupedActivities).length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-[#E7E9EF] p-12 flex flex-col items-center justify-center text-center mt-4">
          <div className="bg-[#F5F7FB] p-4 rounded-full mb-4">
            <ActivityIcon className="w-8 h-8 text-[#8178F2]" />
          </div>
          <h3 className="text-lg font-bold text-[#17181C] mb-1">No activity yet</h3>
          <p className="text-[#6F737D] text-sm max-w-sm">Events matching your selected filter will appear here.</p>
        </div>
      ) : (
        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[1.15rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#E7E9EF] before:to-transparent">
          {Object.entries(groupedActivities).map(([dateLabel, acts]) => (
            <div key={dateLabel} className="relative">
              <div className="sticky top-0 z-10 flex items-center justify-center md:justify-center -ml-2 md:ml-0 mb-6">
                <span className="bg-[#F5F7FB] px-3 py-1 text-xs font-semibold text-[#6F737D] rounded-full border border-[#E7E9EF]">
                  {dateLabel}
                </span>
              </div>
              <div className="space-y-6">
                {acts.map((act) => (
                  <div key={act._id || act.id} className="relative flex items-start gap-4 md:gap-6 pl-10 md:pl-0 md:justify-center">
                    <div className="hidden md:block w-[45%] text-right pt-2">
                      <span className="text-sm font-medium text-[#17181C]">
                        {act.user && typeof act.user === 'object' ? (act.user.name || act.user.email) : (act.user || 'System')}
                      </span>
                      <p className="text-xs text-[#6F737D] mt-0.5">{formatRelativeTime(act.createdAt || act.date)}</p>
                    </div>
                    
                    <div className="absolute left-0 md:relative md:left-auto flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#F5F7FB] bg-white shadow-sm z-10">
                      <ActionIcon action={act.action} />
                    </div>

                    <div className="w-full md:w-[45%] bg-white p-4 rounded-xl border border-[#E7E9EF] shadow-sm">
                      <p className="text-sm text-[#17181C]">{act.action}</p>
                      <div className="md:hidden mt-2 pt-2 border-t border-[#F5F7FB]">
                        <span className="text-xs font-medium text-[#17181C] mr-2">
                          {act.user && typeof act.user === 'object' ? (act.user.name || act.user.email) : (act.user || 'System')}
                        </span>
                        <span className="text-xs text-[#6F737D]">{formatRelativeTime(act.createdAt || act.date)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
};

export default Activity;
