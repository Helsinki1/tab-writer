'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import {
  $getSelection,
  $isRangeSelection,
  $createTextNode,
  $insertNodes,
  $getNodeByKey,
  COMMAND_PRIORITY_CRITICAL,
  KEY_TAB_COMMAND,
  KEY_ESCAPE_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ARROW_DOWN_COMMAND,
} from 'lexical';

// Types
type ToneType = 'professional' | 'casual' | 'creative' | 'concise';

interface AutocompleteState {
  suggestion: string;
  isVisible: boolean;
  isLoading: boolean;
}

// API service
const autocompleteService = {
  async getSuggestion(text: string, tone: ToneType): Promise<string> {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, tone }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.suggestion || '';
    } catch (error) {
      console.error('Autocomplete API error:', error);
      return '';
    }
  },
};

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Autocomplete Plugin with Overlay
function AutocompletePlugin({
  currentTone,
  setCurrentTone,
  autocompleteState,
  setAutocompleteState,
  onEditorTextChange,
  onAcceptSuggestion,
  onDismissSuggestion,
  onSwitchTone,
}: {
  currentTone: ToneType;
  setCurrentTone: (tone: ToneType) => void;
  autocompleteState: AutocompleteState;
  setAutocompleteState: React.Dispatch<React.SetStateAction<AutocompleteState>>;
  onEditorTextChange: (text: string) => void;
  onAcceptSuggestion: () => void;
  onDismissSuggestion: () => void;
  onSwitchTone: (direction: 'up' | 'down') => void;
}) {
  const [editor] = useLexicalComposerContext();
  const [contextText, setContextText] = useState('');
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const debouncedContext = useDebounce(contextText, 500);

  // Provide editor reference to parent component
  useEffect(() => {
    if (editor && typeof onAcceptSuggestion === 'function') {
      // Store editor reference globally for parent component
      (window as any).__lexicalEditor = editor;
    }
  }, [editor, onAcceptSuggestion]);

  // Get text context around cursor position
  const getContextAroundCursor = (fullText: string, cursorOffset: number): string => {
    // Get the last 150 characters before cursor, or from beginning if text is shorter
    const start = Math.max(0, cursorOffset - 150);
    const contextBefore = fullText.substring(start, cursorOffset);
    
    // Find the last sentence or meaningful break to avoid cutting mid-sentence
    const sentences = contextBefore.split(/[.!?]\s+/);
    if (sentences.length > 1) {
      // Return the last complete sentence plus any partial sentence
      return sentences.slice(-2).join('. ').trim();
    }
    
    return contextBefore.trim();
  };

  // Listen to editor changes and track cursor position
  useEffect(() => {
    const removeListener = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const root = editor.getRootElement();
          const fullText = root?.textContent || '';
          onEditorTextChange(fullText);
          
          // Get cursor position
          const anchorNode = selection.anchor.getNode();
          const anchorOffset = selection.anchor.offset;
          
          // Calculate text offset for context extraction
          let textOffset = 0;
          if (anchorNode.getTextContent) {
            const textContent = anchorNode.getTextContent();
            textOffset = anchorOffset;
            
            // Add offset from previous siblings
            let sibling = anchorNode.getPreviousSibling();
            while (sibling) {
              if (sibling.getTextContent) {
                textOffset += sibling.getTextContent().length;
              }
              sibling = sibling.getPreviousSibling();
            }
          }
          
          // Get focused context around cursor
          const context = getContextAroundCursor(fullText, textOffset);
          setContextText(context);
          
          // Update cursor position for overlay positioning
          try {
            // Use the selection to get cursor position
            const nativeSelection = window.getSelection();
            if (nativeSelection && nativeSelection.rangeCount > 0) {
              const range = nativeSelection.getRangeAt(0);
              const rect = range.getBoundingClientRect();
              const editorRect = root?.getBoundingClientRect();
              
              if (rect && editorRect && rect.height > 0) {
                setCursorPosition({
                  x: Math.max(0, rect.left - editorRect.left),
                  y: Math.max(0, rect.bottom - editorRect.top + 5)
                });
              } else {
                // Fallback positioning
                setCursorPosition({ x: 20, y: 60 });
              }
            } else {
              setCursorPosition({ x: 20, y: 60 });
            }
          } catch (error) {
            // Fallback to default position if cursor tracking fails
            console.warn('Cursor position tracking failed:', error);
            setCursorPosition({ x: 20, y: 60 });
          }
        }
      });
    });

    return removeListener;
  }, [editor, onEditorTextChange]);

  // Generate suggestions when context changes
  useEffect(() => {
    if (debouncedContext.trim().length < 5) {
      setAutocompleteState(prev => ({ ...prev, isVisible: false, suggestion: '' }));
      return;
    }

    const generateSuggestion = async () => {
      setAutocompleteState(prev => ({ ...prev, isLoading: true }));
      
      try {
        const suggestion = await autocompleteService.getSuggestion(debouncedContext, currentTone);
        if (suggestion && suggestion.trim()) {
          setAutocompleteState({
            suggestion: suggestion.trim(),
            isVisible: true,
            isLoading: false,
          });
        } else {
          setAutocompleteState(prev => ({ ...prev, isLoading: false, isVisible: false }));
        }
      } catch (error) {
        console.error('Error generating suggestion:', error);
        setAutocompleteState(prev => ({ ...prev, isLoading: false, isVisible: false }));
      }
    };

    generateSuggestion();
  }, [debouncedContext, currentTone, setAutocompleteState]);

  // Store cursor position for parent component
  useEffect(() => {
    (window as any).__cursorPosition = cursorPosition;
  }, [cursorPosition]);

  return null;
}

// Tone indicator component
function ToneIndicator({ tone, isLoading }: { tone: ToneType; isLoading: boolean }) {
  const toneConfig = {
    professional: { label: 'Professional', className: 'tone-professional' },
    casual: { label: 'Casual', className: 'tone-casual' },
    creative: { label: 'Creative', className: 'tone-creative' },
    concise: { label: 'Concise', className: 'tone-concise' },
  };

  return (
    <div className="flex items-center space-x-2">
      <span className={`tone-badge ${toneConfig[tone].className}`}>
        {toneConfig[tone].label}
      </span>
      {isLoading && (
        <div className="loading-spinner"></div>
      )}
    </div>
  );
}

// Word count component
function WordCounter({ text }: { text: string }) {
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  return (
    <div className="text-sm text-gray-500 dark:text-gray-400">
      {wordCount} words, {charCount} characters
    </div>
  );
}

// Initial editor config
const initialConfig = {
  namespace: 'TabWriter',
  theme: {
    text: {
      bold: 'font-bold',
      italic: 'italic',
    },
  },
  onError: (error: Error) => {
    console.error('Lexical error:', error);
  },
};

// Main WritingEditor component
export default function WritingEditor() {
  const [currentTone, setCurrentTone] = useState<ToneType>('professional');
  const [autocompleteState, setAutocompleteState] = useState<AutocompleteState>({
    suggestion: '',
    isVisible: false,
    isLoading: false,
  });
  const [editorText, setEditorText] = useState('');
  const tones: ToneType[] = ['professional', 'casual', 'creative', 'concise'];

  // Handle editor text changes
  const handleEditorTextChange = useCallback((text: string) => {
    setEditorText(text);
  }, []);

  // Handle tone switching
  const handleSwitchTone = useCallback((direction: 'up' | 'down') => {
    const currentIndex = tones.indexOf(currentTone);
    let newIndex;
    
    if (direction === 'up') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : tones.length - 1;
    } else {
      newIndex = currentIndex < tones.length - 1 ? currentIndex + 1 : 0;
    }
    
    setCurrentTone(tones[newIndex]);
  }, [currentTone, tones]);

  // Accept suggestion
  const handleAcceptSuggestion = useCallback(() => {
    if (!autocompleteState.suggestion || !autocompleteState.isVisible) return;

    const editor = (window as any).__lexicalEditor;
    if (editor) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const textNode = $createTextNode(' ' + autocompleteState.suggestion);
          $insertNodes([textNode]);
        }
      });
    }

    setAutocompleteState(prev => ({ ...prev, isVisible: false, suggestion: '' }));
  }, [autocompleteState.suggestion, autocompleteState.isVisible]);

  // Dismiss suggestion
  const handleDismissSuggestion = useCallback(() => {
    setAutocompleteState(prev => ({ ...prev, isVisible: false, suggestion: '' }));
  }, []);

  // Handle keyboard events
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!autocompleteState.isVisible || !autocompleteState.suggestion) return;

    // Check for Ctrl/Cmd key combinations
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;

    if (isCtrlOrCmd && event.key === 'Enter') {
      event.preventDefault();
      handleAcceptSuggestion();
    } else if (isCtrlOrCmd && event.key === 'ArrowUp') {
      event.preventDefault();
      handleSwitchTone('up');
    } else if (isCtrlOrCmd && event.key === 'ArrowDown') {
      event.preventDefault();
      handleSwitchTone('down');
    } else if (event.key === 'Escape') {
      event.preventDefault();
      handleDismissSuggestion();
    }
  }, [autocompleteState.isVisible, autocompleteState.suggestion, handleAcceptSuggestion, handleDismissSuggestion, handleSwitchTone]);

  // Copy to clipboard function
  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(editorText).then(() => {
      // You could add a toast notification here
      console.log('Text copied to clipboard');
    });
  }, [editorText]);

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <ToneIndicator tone={currentTone} isLoading={autocompleteState.isLoading} />
        
        <div className="flex items-center space-x-4">
          <WordCounter text={editorText} />
          <button
            onClick={copyToClipboard}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Copy
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="relative">
        <LexicalComposer initialConfig={initialConfig}>
          <PlainTextPlugin
            contentEditable={
              <ContentEditable
                className="editor-inner min-h-96 outline-none resize-none"
                placeholder="Start writing your text here..."
                onKeyDown={handleKeyDown}
              />
            }
            placeholder={
              <div className="editor-placeholder">
                Start writing your text here...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <AutocompletePlugin
            currentTone={currentTone}
            setCurrentTone={setCurrentTone}
            autocompleteState={autocompleteState}
            setAutocompleteState={setAutocompleteState}
            onEditorTextChange={handleEditorTextChange}
            onAcceptSuggestion={handleAcceptSuggestion}
            onDismissSuggestion={handleDismissSuggestion}
            onSwitchTone={handleSwitchTone}
          />
        </LexicalComposer>
        
        {/* Suggestion Overlay */}
        {autocompleteState.isVisible && autocompleteState.suggestion && (
          <div 
            className="absolute pointer-events-none z-10"
            style={{
              left: `${(window as any).__cursorPosition?.x || 20}px`,
              top: `${((window as any).__cursorPosition?.y || 20) + 5}px`,
            }}
          >
            <div className="suggestion-text bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 max-w-xs">
              <span className="text-gray-600 dark:text-gray-300 italic">
                {autocompleteState.suggestion}
              </span>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl+Enter</kbd> accept • 
                <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl+↑↓</kbd> tone • 
                <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Esc</kbd> dismiss
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 