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
  COMMAND_PRIORITY_HIGH,
  KEY_TAB_COMMAND,
  KEY_ESCAPE_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ARROW_DOWN_COMMAND,
} from 'lexical';

// Types
type ToneType = 'professional' | 'casual' | 'creative' | 'concise' | 'witty' | 'instructional' | 'urgent' | 'reflective';
type PurposeType = 'persuasive' | 'informative' | 'descriptive' | 'flattering' | 'narrative';
type ModeType = 'tone' | 'purpose';

interface AutocompleteState {
  suggestion: string;
  isVisible: boolean;
  isLoading: boolean;
}

// API service
const autocompleteService = {
  async getSuggestion(text: string, tone: ToneType, purpose: PurposeType): Promise<string> {
    try {
      const response = await fetch('/api/autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, tone, purpose }),
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
  currentPurpose,
  setCurrentPurpose,
  currentMode,
  setCurrentMode,
  autocompleteState,
  setAutocompleteState,
  onEditorTextChange,
  onAcceptSuggestion,
  onDismissSuggestion,
  onSwitchTone,
  onSwitchPurpose,
  onSwitchMode,
}: {
  currentTone: ToneType;
  setCurrentTone: (tone: ToneType) => void;
  currentPurpose: PurposeType;
  setCurrentPurpose: (purpose: PurposeType) => void;
  currentMode: ModeType;
  setCurrentMode: (mode: ModeType) => void;
  autocompleteState: AutocompleteState;
  setAutocompleteState: React.Dispatch<React.SetStateAction<AutocompleteState>>;
  onEditorTextChange: (text: string) => void;
  onAcceptSuggestion: () => void;
  onDismissSuggestion: () => void;
  onSwitchTone: (direction: 'up' | 'down') => void;
  onSwitchPurpose: (direction: 'up' | 'down') => void;
  onSwitchMode: (direction: 'left' | 'right') => void;
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

  // Register Enter key command listener to handle Ctrl+Enter
  useEffect(() => {
    if (!editor) return;

    const removeEnterListener = editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event: KeyboardEvent | null) => {
        if (!event) return false;
        
        // Check for Ctrl/Cmd + Enter
        const isCtrlOrCmd = event.ctrlKey || event.metaKey;
        if (isCtrlOrCmd) {
          // Prevent the Enter from creating a newline
          if (autocompleteState.isVisible && autocompleteState.suggestion) {
            onAcceptSuggestion();
          }
          return true; // Return true to prevent default behavior
        }
        
        return false; // Let normal Enter behavior proceed
      },
      COMMAND_PRIORITY_HIGH
    );

    return removeEnterListener;
  }, [editor, autocompleteState.isVisible, autocompleteState.suggestion, onAcceptSuggestion]);

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
        const suggestion = await autocompleteService.getSuggestion(debouncedContext, currentTone, currentPurpose);
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
  }, [debouncedContext, currentTone, currentPurpose, setAutocompleteState]);

  // Store cursor position for parent component
  useEffect(() => {
    (window as any).__cursorPosition = cursorPosition;
  }, [cursorPosition]);

  return null;
}

// Controls indicator component
function ControlsIndicator({ 
  tone, 
  purpose, 
  currentMode, 
  isLoading 
}: { 
  tone: ToneType; 
  purpose: PurposeType; 
  currentMode: ModeType; 
  isLoading: boolean; 
}) {
  const toneConfig = {
    professional: { label: 'Professional', className: 'tone-professional' },
    casual: { label: 'Casual', className: 'tone-casual' },
    creative: { label: 'Creative', className: 'tone-creative' },
    concise: { label: 'Concise', className: 'tone-concise' },
    witty: { label: 'Witty', className: 'tone-witty' },
    instructional: { label: 'Instructional', className: 'tone-instructional' },
    urgent: { label: 'Urgent', className: 'tone-urgent' },
    reflective: { label: 'Reflective', className: 'tone-reflective' },
  };

  const purposeConfig = {
    persuasive: { label: 'Persuasive', className: 'purpose-persuasive' },
    informative: { label: 'Informative', className: 'purpose-informative' },
    descriptive: { label: 'Descriptive', className: 'purpose-descriptive' },
    flattering: { label: 'Flattering', className: 'purpose-flattering' },
    narrative: { label: 'Narrative', className: 'purpose-narrative' },
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-500">Tone:</span>
        <span className={`tone-badge ${toneConfig[tone].className} ${currentMode === 'tone' ? 'ring-2 ring-blue-400' : ''}`}>
          {toneConfig[tone].label}
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-500">Purpose:</span>
        <span className={`tone-badge ${purposeConfig[purpose].className} ${currentMode === 'purpose' ? 'ring-2 ring-blue-400' : ''}`}>
          {purposeConfig[purpose].label}
        </span>
      </div>
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
  const [currentPurpose, setCurrentPurpose] = useState<PurposeType>('informative');
  const [currentMode, setCurrentMode] = useState<ModeType>('tone');
  const [autocompleteState, setAutocompleteState] = useState<AutocompleteState>({
    suggestion: '',
    isVisible: false,
    isLoading: false,
  });
  const [editorText, setEditorText] = useState('');
  const tones: ToneType[] = ['professional', 'casual', 'creative', 'concise', 'witty', 'instructional', 'urgent', 'reflective'];
  const purposes: PurposeType[] = ['persuasive', 'informative', 'descriptive', 'flattering', 'narrative'];

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

  // Handle purpose switching
  const handleSwitchPurpose = useCallback((direction: 'up' | 'down') => {
    const currentIndex = purposes.indexOf(currentPurpose);
    let newIndex;
    
    if (direction === 'up') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : purposes.length - 1;
    } else {
      newIndex = currentIndex < purposes.length - 1 ? currentIndex + 1 : 0;
    }
    
    setCurrentPurpose(purposes[newIndex]);
  }, [currentPurpose, purposes]);

  // Handle mode switching
  const handleSwitchMode = useCallback((direction: 'left' | 'right') => {
    if (direction === 'right') {
      setCurrentMode(currentMode === 'tone' ? 'purpose' : 'tone');
    } else {
      setCurrentMode(currentMode === 'purpose' ? 'tone' : 'purpose');
    }
  }, [currentMode]);

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
    // Check for Ctrl/Cmd key combinations
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;

    // Handle mode switching (works even when no suggestion is visible)
    if (isCtrlOrCmd && event.key === 'ArrowLeft') {
      event.preventDefault();
      event.stopPropagation();
      handleSwitchMode('left');
      return;
    } else if (isCtrlOrCmd && event.key === 'ArrowRight') {
      event.preventDefault();
      event.stopPropagation();
      handleSwitchMode('right');
      return;
    }

    // Note: Ctrl+Enter is now handled by Lexical's command system above

    // Handle other suggestion-related shortcuts only when suggestion is visible
    if (!autocompleteState.isVisible || !autocompleteState.suggestion) return;

    if (isCtrlOrCmd && event.key === 'ArrowUp') {
      event.preventDefault();
      event.stopPropagation();
      if (currentMode === 'tone') {
        handleSwitchTone('up');
      } else {
        handleSwitchPurpose('up');
      }
    } else if (isCtrlOrCmd && event.key === 'ArrowDown') {
      event.preventDefault();
      event.stopPropagation();
      if (currentMode === 'tone') {
        handleSwitchTone('down');
      } else {
        handleSwitchPurpose('down');
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      handleDismissSuggestion();
    }
  }, [
    autocompleteState.isVisible, 
    autocompleteState.suggestion, 
    currentMode, 
    handleAcceptSuggestion, 
    handleDismissSuggestion, 
    handleSwitchTone, 
    handleSwitchPurpose, 
    handleSwitchMode
  ]);

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
                  <ControlsIndicator 
            tone={currentTone} 
            purpose={currentPurpose} 
            currentMode={currentMode} 
            isLoading={autocompleteState.isLoading} 
          />
        
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
            currentPurpose={currentPurpose}
            setCurrentPurpose={setCurrentPurpose}
            currentMode={currentMode}
            setCurrentMode={setCurrentMode}
            autocompleteState={autocompleteState}
            setAutocompleteState={setAutocompleteState}
            onEditorTextChange={handleEditorTextChange}
            onAcceptSuggestion={handleAcceptSuggestion}
            onDismissSuggestion={handleDismissSuggestion}
            onSwitchTone={handleSwitchTone}
            onSwitchPurpose={handleSwitchPurpose}
            onSwitchMode={handleSwitchMode}
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