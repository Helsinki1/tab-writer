'use client'

import React from 'react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onCopy?: () => void
}

export default function AuthModal({ isOpen, onClose, onCopy }: AuthModalProps) {
  if (!isOpen) return null

  const handleStarAndCopy = () => {
    window.open('https://github.com/Helsinki1/tab-writer', '_blank')
    if (onCopy) {
      onCopy()
    }
    onClose()
  }

  const handleJustCopy = () => {
    if (onCopy) {
      onCopy()
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-md mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="text-center">
          <div className="mb-6">
            <div className="text-4xl mb-4">⭐</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Enjoying Chameleon?
            </h2>
            <p className="text-gray-600">
              If you find this AI writing assistant helpful, please consider starring our GitHub repository! Your support helps us continue improving the tool.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleStarAndCopy}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              Star on GitHub
            </button>
            <button
              onClick={handleJustCopy}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Just Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 