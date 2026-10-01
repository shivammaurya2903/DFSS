import React, { useState, useEffect } from 'react';
import PageContainer from '../components/layout/PageContainer';
import * as activityService from '../services/activity.service';

const Activity = () => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const data = await activityService.getActivities();
        setActivities(data || []);
      } catch (err) {
        console.error('Error fetching activities:', err);
      }
    };
    loadActivities();
  }, []);

  return (
    <PageContainer>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Activity Log</h1>
      {activities.length > 0 ? (
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
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <p className="text-gray-500">System activity and logs will appear here.</p>
        </div>
      )}
    </PageContainer>
  );
};

export default Activity;

