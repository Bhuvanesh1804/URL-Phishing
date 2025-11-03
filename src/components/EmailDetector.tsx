import { useState } from 'react';
import { Mail, AlertTriangle, Loader2, ShieldCheck } from 'lucide-react';
import { detectSpamEmail } from '../services/detectionService';
import type { EmailDetectionResult } from '../types';

export function EmailDetector() {
  const [sender, setSender] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EmailDetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sender.trim() || !subject.trim() || !content.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const detection = await detectSpamEmail(subject, content, sender);
      setResult(detection);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="w-8 h-8 text-green-600" />
        <h2 className="text-2xl font-bold text-gray-900">Email Spam Detector</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="sender" className="block text-sm font-medium text-gray-700 mb-2">
            Sender Email
          </label>
          <input
            type="email"
            id="sender"
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            placeholder="sender@example.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
            Email Subject
          </label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter email subject"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            Email Content
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste email content here..."
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !sender.trim() || !subject.trim() || !content.trim()}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Analyze Email'
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
          result.isSpam
            ? 'bg-red-50 border-red-300'
            : 'bg-green-50 border-green-300'
        }`}>
          <div className="flex items-start gap-3 mb-4">
            {result.isSpam ? (
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className={`text-lg font-bold mb-1 ${
                result.isSpam ? 'text-red-900' : 'text-green-900'
              }`}>
                {result.isSpam ? 'Spam Detected' : 'Email is Legitimate'}
              </h3>
              <p className={`text-sm ${
                result.isSpam ? 'text-red-700' : 'text-green-700'
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
                  result.isSpam ? 'bg-red-600' : 'bg-green-600'
                }`}
                style={{ width: `${result.confidence * 100}%` }}
              />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="p-3 bg-white rounded border border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-1">From</p>
              <p className="text-sm text-gray-900">{result.sender}</p>
            </div>
            <div className="p-3 bg-white rounded border border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-1">Subject</p>
              <p className="text-sm text-gray-900">{result.subject}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
