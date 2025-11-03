import { useState, useEffect } from 'react';
import { BarChart3, Shield, AlertTriangle, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { DetectionHistory } from '../types';

interface Stats {
  totalDetections: number;
  urlDetections: number;
  emailDetections: number;
  phishingFound: number;
  spamFound: number;
  safeItems: number;
}

export function DetectionStats() {
  const [stats, setStats] = useState<Stats>({
    totalDetections: 0,
    urlDetections: 0,
    emailDetections: 0,
    phishingFound: 0,
    spamFound: 0,
    safeItems: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('detection_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (data) {
        const history = data as DetectionHistory[];

        const urlCount = history.filter(h => h.detection_type === 'url').length;
        const emailCount = history.filter(h => h.detection_type === 'email').length;
        const phishingCount = history.filter(h => h.result === 'phishing').length;
        const spamCount = history.filter(h => h.result === 'spam').length;
        const safeCount = history.filter(h => h.result === 'safe').length;

        setStats({
          totalDetections: history.length,
          urlDetections: urlCount,
          emailDetections: emailCount,
          phishingFound: phishingCount,
          spamFound: spamCount,
          safeItems: safeCount,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-8 h-8 text-slate-700" />
        <h2 className="text-2xl font-bold text-gray-900">Detection Statistics</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Scans</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalDetections}</p>
            </div>
            <BarChart3 className="w-10 h-10 text-slate-400" />
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">URL Checks</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{stats.urlDetections}</p>
            </div>
            <Shield className="w-10 h-10 text-blue-400" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Email Checks</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{stats.emailDetections}</p>
            </div>
            <Mail className="w-10 h-10 text-green-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-700">Phishing Detected</p>
              <p className="text-2xl font-bold text-red-900 mt-1">{stats.phishingFound}</p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-orange-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-orange-700">Spam Detected</p>
              <p className="text-2xl font-bold text-orange-900 mt-1">{stats.spamFound}</p>
            </div>
          </div>
        </div>

        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-700">Safe Items</p>
              <p className="text-2xl font-bold text-emerald-900 mt-1">{stats.safeItems}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
