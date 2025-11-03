import { useState } from 'react';
import { Shield, AlertTriangle, Loader2 } from 'lucide-react';
import { detectPhishingURL } from '../services/detectionService';
import type { URLDetectionResult } from '../types';

export function URLDetector() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<URLDetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const normalizedUrl = url.trim().toLowerCase();
      const detection = await detectPhishingURL(normalizedUrl);
      setResult(detection);
      setUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">URL Phishing Detector</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
            Enter URL to Check
          </label>
          <input
            type="text"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Analyze URL'
          )}
        </button>
      </form>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className={`mt-6 p-6 rounded-lg border-2 ${
          result.isPhishing
            ? 'bg-red-50 border-red-300'
            : 'bg-green-50 border-green-300'
        }`}>
          <div className="flex items-start gap-3 mb-4">
            {result.isPhishing ? (
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            ) : (
              <Shield className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className={`text-lg font-bold mb-1 ${
                result.isPhishing ? 'text-red-900' : 'text-green-900'
              }`}>
                {result.isPhishing ? 'Phishing Detected' : 'URL is Safe'}
              </h3>
              <p className={`text-sm ${
                result.isPhishing ? 'text-red-700' : 'text-green-700'
              }`}>
                {result.message}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Confidence Score</span>
              <span className="text-sm font-bold text-gray-900">
                {(result.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  result.isPhishing ? 'bg-red-600' : 'bg-green-600'
                }`}
                style={{ width: `${result.confidence * 100}%` }}
              />
            </div>
          </div>

          <div className="mt-4 p-3 bg-white rounded border border-gray-200">
            <p className="text-xs font-medium text-gray-500 mb-1">Analyzed URL</p>
            <p className="text-sm text-gray-900 break-all">{result.url}</p>
          </div>

          <div className="mt-4">
            <button
              onClick={() => {
                setResult(null);
                setUrl('');
              }}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Analyze Another URL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
