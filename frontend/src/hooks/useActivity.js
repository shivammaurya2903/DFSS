import { useCallback, useEffect, useState } from 'react';
import * as activityService from '../services/activity.service';
import { useToast } from '../context/ToastContext';

const useActivity = ({ page = 1, limit = 50, action, auto = true } = {}) => {
  const { addToast } = useToast();
  const [activities, setActivities] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(auto);
  const [error, setError] = useState(null);

  const load = useCallback(async ({ signal } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await activityService.getActivityPage({ page, limit, action, signal });
      if (signal?.aborted) return;
      setActivities(Array.isArray(result.data) ? result.data : []);
      setPagination(result.pagination);
    } catch (err) {
      if (signal?.aborted || err.name === 'CanceledError') return;
      setError(err.userMessage || err.response?.data?.message || 'Failed to load activity log');
      addToast('Failed to load activity log', 'error');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [page, limit, action, addToast]);

  useEffect(() => {
    if (!auto) return undefined;
    const controller = new AbortController();
    load({ signal: controller.signal });
    return () => controller.abort();
  }, [auto, load]);

  return { activities, pagination, loading, error, refresh: load };
};

export default useActivity;
