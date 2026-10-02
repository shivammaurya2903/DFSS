import React, { useState, useEffect } from 'react';
import PageContainer from '../components/layout/PageContainer';
import * as activityService from '../services/activity.service';
import { Activity as ActivityIcon } from 'lucide-react';

const Activity = () => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    
    const loadActivities = async () => {
      try {
        const data = await activityService.getActivity({ signal: controller.signal });
        setActivities(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
        console.error('Error fetching activities:', err);
      }
    };
    
    loadActivities();
    
    return () => {
      controller.abort();
    };
  }, []);

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Activity Log</h1>
        <p className="text-gray-500 text-sm mt-1">Review important activity across your storage account.</p>
      </div>
      
      {activities.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 flex flex-col items-center justify-center text-center mt-8">
          <div className="bg-[#f4f2ff] p-4 rounded-full mb-4">
            <ActivityIcon className="w-8 h-8 text-[#8178F2]" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">No activity yet</h3>
          <p className="text-gray-500 text-sm max-w-sm">Your file uploads, downloads, and account events will appear here as you work.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Action</th>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {activities.map((act) => (
                <tr key={act._id || act.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-700">{act.action}</td>
                  <td className="px-6 py-4 text-gray-500">{act.user}</td>
                  <td className="px-6 py-4 text-gray-500">{new Date(act.createdAt || act.date).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
};

export default Activity;
