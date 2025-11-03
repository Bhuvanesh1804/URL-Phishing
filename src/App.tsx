import { useState } from 'react';
import { Shield, Mail } from 'lucide-react';
import { URLDetector } from './components/URLDetector';
import { EmailDetector } from './components/EmailDetector';
import { DetectionStats } from './components/DetectionStats';

type TabType = 'url' | 'email';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('url');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-12 h-12 text-slate-700" />
            <h1 className="text-4xl font-bold text-gray-900">
              Cybersecurity Detection System
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Advanced machine learning-based threat detection for phishing URLs and spam emails
          </p>
        </header>

        <div className="mb-8">
          <DetectionStats />
        </div>

        <div className="max-w-2xl mx-auto mb-6">
          <div className="bg-white rounded-lg shadow-md p-2 flex gap-2">
            <button
              onClick={() => setActiveTab('url')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md font-semibold transition-all ${
                activeTab === 'url'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Shield className="w-5 h-5" />
              URL Scanner
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md font-semibold transition-all ${
                activeTab === 'email'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Mail className="w-5 h-5" />
              Email Scanner
            </button>
          </div>
        </div>

        <div className="mb-8">
          {activeTab === 'url' ? <URLDetector /> : <EmailDetector />}
        </div>

        <footer className="text-center text-sm text-gray-500 mt-12">
          <p>Real-time threat detection powered by machine learning algorithms</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
