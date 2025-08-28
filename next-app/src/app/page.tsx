'use client';

import React, { useState } from 'react';
import WritingEditor from '../components/WritingEditor';
import Header from '../components/Header';
import AuthModal from '../components/AuthModal';

export default function Home() {
  const [showStarModal, setShowStarModal] = useState(false);
  const [pendingCopyText, setPendingCopyText] = useState('');

  const handleShowStarRequest = (textToCopy: string) => {
    setPendingCopyText(textToCopy);
    setShowStarModal(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(pendingCopyText).then(() => {
      console.log('Text copied to clipboard');
      setPendingCopyText('');
    });
  };

  return (
    <div>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 transition-colors duration-300">
        <Header />
        
        <div className="transform origin-top" style={{ transform: 'scale(1.33)' }}>
        <main className="container mx-auto px-4 py-8">
            <div className="max-w-5xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Chameleon
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                AI-assisted writing that retains your voice and style by autocompleting thoughts.
              </p>
            </div>

            {/* Writing Interface */}
            <div className="bg-white rounded-lg shadow-xl border border-gray-200">
              <WritingEditor onStarRequest={handleShowStarRequest} />
            </div>

            {/* Keyboard Shortcuts Help */}
            <div className="mt-8 bg-white rounded-lg p-6 shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Keyboard Shortcuts
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Accept suggestion:</span>
                  <div className="flex space-x-1">
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-gray-900">Ctrl</kbd>
                    <span className="text-gray-600">+</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-gray-900">Enter</kbd>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dismiss suggestion:</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-gray-900">Escape</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Switch tone up:</span>
                  <div className="flex space-x-1">
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-gray-900">Ctrl</kbd>
                    <span className="text-gray-600">+</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-gray-900">↑</kbd>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Switch tone down:</span>
                  <div className="flex space-x-1">
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-gray-900">Ctrl</kbd>
                    <span className="text-gray-600">+</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-gray-900">↓</kbd>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                * Use Cmd instead of Ctrl on macOS
              </div>
            </div>
          </div>
        </main>
        </div>

        {/* GitHub Star Modal */}
        <AuthModal 
          isOpen={showStarModal} 
          onClose={() => setShowStarModal(false)}
          onCopy={handleCopy}
        />
      </div>
    </div>
  );
} 