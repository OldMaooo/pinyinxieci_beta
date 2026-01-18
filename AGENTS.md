# AGENTS.md

Agentic coding guidelines for this repository.

## Build & Development Commands

```bash
# Development
npm run dev          # Start Vite dev server on 0.0.0.0:5173

# Testing Individual Features (no test framework configured)
# Approach 1: Manual testing in browser
# 1. Start dev server
npm run dev
# 2. Open http://localhost:5173
# 3. Test specific feature by navigating through UI
# 4. Check console for errors (F12)
#
# Approach 2: Component isolation testing
# Create minimal test file (e.g., test-audio.html)
# Test specific functionality without full app overhead
# Example: Created demo-audio-test.html and demo-ultimate-test.html for TTS debugging

# Production
npm run build       # Build for production (Vite)
npm run preview     # Preview production build locally

# Alternative dev port (if port 5173 occupied)
npm run dev -- --host 0.0.0.0 --port 5174

# Clean port before starting (if needed)
lsof -ti:5173 | xargs kill -9 2>/dev/null
npm run dev
```

## Code Style Guidelines

### File Structure & Extensions
- **Pure JavaScript**: Use `.jsx` for React components, `.js` for utilities
- **No TypeScript**: Project uses JavaScript without static typing
- **Components**: PascalCase filenames (`App.jsx`, `FlashCardView.jsx`, `StrokeOrderPlayer.jsx`)
- **Utilities**: camelCase or kebab-case filenames (`flashcardAudioBridge.js`, `baidu-tts.js`)
- **Entry point**: `src/main.jsx` → `src/App.jsx`
- **Shared code**: `shared/` directory for reusable utilities

### Component Architecture
- **Functional Components**: Default pattern for all UI components
- **Hooks**: Heavy use of `useState`, `useEffect`, `useRef`, `useMemo`
  - `useState`: For local UI state and data
  - `useEffect`: Side effects (data fetching, timers, library initialization)
  - `useRef`: DOM references and persistent values across renders
  - `useMemo`: Expensive computations and data transformations
- **Class Components**: Only used for Error Boundaries (lifecycle methods required)
- **Single-file Components**: Multiple related sub-components can be defined in same file for cohesion

### Import Patterns
```javascript
// 1. React & hooks
import React, { useState, useEffect, useMemo, useRef } from 'react';

// 2. External libraries
import { pinyin } from 'pinyin-pro';
import { createClient } from '@supabase/supabase-js';
import { LogOut, Check, Volume2 } from 'lucide-react';

// 3. Local utilities and shared code
import { playFlashcardAudio } from '../shared/flashcardAudioBridge.js';
```

### Naming Conventions
- **Components**: PascalCase (`FlashCardView`, `StrokeOrderPlayer`)
- **Variables & Functions**: camelCase (`isDarkMode`, `handleInteraction`, `speak`)
- **Constants**: SCREAMING_SNAKE_CASE (`SUPABASE_URL`, `DATA_BLUEPRINT`)
- **Booleans**: Prefix with `is`, `has`, `should` (`isLoading`, `hasError`, `shouldSave`)
- **Event Handlers**: Prefix with `handle` (`handleClick`, `handleSubmit`)
- **Refs**: camelCase with `Ref` suffix (`containerRef`, `timerRef`, `fadeRef`)

### State Management
- **Local State**: `useState` for component-specific state
- **Persistence**: `localStorage` for user preferences (`isDarkMode`, `selectedUnits`)
- **Cloud Sync**: Supabase for remote data (mastery records)
- **Derived State**: Use `useMemo` instead of duplicating state variables
- **State Updates**: Prefer functional updates when derived from previous state
  ```javascript
  setWords(prev => prev.map(w => w.id === id ? { ...w, [type]: val } : w))
  ```

### Error Handling
- **Error Boundary**: Top-level class component (`ErrorBoundary`) to catch crashes
- **Try-Catch**: All async operations (API calls, browser APIs, third-party libs)
- **Graceful Degradation**: Fallbacks when APIs fail (e.g., Baidu TTS → Web Speech API)
- **Silent Failures**: Log warnings for non-critical failures, don't block UI
- **Console Logging**: Keep for debugging - use `console.log`, `console.warn`, `console.error`
  ```javascript
  // Pattern for async operations
  try {
    await someAsyncOperation();
  } catch (e) {
    console.error('[ComponentName] Error:', e);
    // Fallback or silent fail
  }
  ```

### Styling Approach
- **Tailwind CSS**: Primary styling method for all components
- **Dynamic Classes**: Use template literals for conditional styling
  ```javascript
  className={`flex items-center ${isActive ? 'bg-blue-50' : ''}`}
  ```
- **Animations**: Tailwind utilities (`animate-in`, `fade-in`, `zoom-in`)
- **Inline Styles**: Only for truly dynamic values (width, cursor, animation duration)
- **Custom Font**: Use `.font-kaiti` or `font-family: 'STKaiti', 'KaiTi', '楷体', serif` for Chinese characters
- **Z-Index Management**:
  - Base z-index: 100 for fixed headers
  - Modals: 500-1000
  - Overlays: 2000+

### API & Data Patterns
- **Supabase**: Direct client-side calls with `@supabase/supabase-js`
- **Async/Await**: Standard pattern for all async operations
- **Database**: `select`, `upsert`, `range` for CRUD operations
- **Pagination**: Use `range(0, 9999)` for large datasets
- **Error Handling**: Check `{ data, error }` from Supabase responses
  ```javascript
  const { data, error } = await supabase.from('table').select('*');
  if (error) {
    console.error('[Supabase] Error:', error);
    return;
  }
  ```

### Audio/TTS Specific Guidelines
- **Audio Unlock**: Must have user interaction before playing (browser autoplay policy)
  ```javascript
  const unlockAudio = () => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    window.speechSynthesis.speak(u);
  };
  ```
- **Keep-Alive**: Chrome has 15-second timeout bug, need periodic silent utterances
  ```javascript
  setInterval(() => {
    const utterance = new SpeechSynthesisUtterance('');
    utterance.volume = 0;
    window.speechSynthesis.speak(utterance);
  }, 14000);
  ```
- **Browser Compatibility**: Test in both Chrome and Safari - they handle speechSynthesis differently
- **Simple Calls**: Avoid complex voice selection, retry mechanisms - use browser defaults

### Code Quality Notes
- **No Linting/Testing**: Project currently lacks ESLint, Prettier, or test frameworks
- **JSDoc**: Use in utility files for documenting functions with parameters and return types
- **Comments**: Minimal inline comments; prefer self-documenting code
  ```javascript
  // Avoid:
  // Set the active index to 0
  setActiveVoiceIndex(0);

  // Better (self-documenting):
  setActiveVoiceIndex(0);
  ```
- **Console Logging**: Keep for debugging (`console.log`, `console.warn`, `console.error`)

### Performance Best Practices
- **Memoization**: Use `useMemo` for expensive data processing (e.g., filtering vocab lists)
- **Cleanup**: Return cleanup functions from `useEffect` (timers, event listeners, subscriptions)
  ```javascript
  useEffect(() => {
    const timer = setInterval(..., 1000);
    return () => clearInterval(timer);  // Cleanup
  }, []);
  ```
- **Avoid Re-renders**: Stable refs for values that shouldn't trigger re-renders
- **Debounce**: For rapid-fire events (resize, input)

## Common Pitfalls & Solutions

### Avoid These Mistakes
1. **Duplicate Declarations**: Always grep for existing declarations before adding new ones
   ```bash
   grep -n "functionName" src/App.jsx
   ```
2. **Missing Cleanup**: Always return cleanup from useEffect - memory leaks will freeze the app
3. **State Race Conditions**: Use functional updates when state depends on previous state
4. **Hardcoded Strings**: Use constants for repeated strings
5. **Ignoring Browser Differences**: Test in both Chrome and Safari

### Testing Without Test Framework
Since no test framework is configured:
1. **Manual Testing**: Click through every user flow
2. **Console Monitoring**: Keep DevTools open, watch for errors
3. **Edge Cases**: Test with empty data, network errors, rapid clicks
4. **Cross-Browser**: Test in Chrome, Safari, and if possible, Firefox
5. **Create Test Files**: Like demo-audio-test.html for isolated feature testing

## Context & Domain Knowledge

This is a **Chinese character (Hanzi) dictation practice app** for primary school students (Grade 3).

- **Units**: Teaching units from textbook (单元1, 单元2, etc.)
- **Vocab Blueprint**: Hard-coded data structure merging word lists and character lists
- **Mastery Tracking**: Three-stage practice (自由练习 → 模拟自测 → 家长终测)
- **Mastery States**: NEW (无记录), WEAK (有错), MASTERED (连续正确)
- **Audio**: Chinese TTS for word pronunciation - Keep-Alive mechanism required for Chrome
- **Cloud Sync**: Supabase stores mastery history across devices
- **User**: 老毛 (born 1986, China) - recorded in /Users/mao/.config/opencode/AGENTS.md

## Git Workflow

```bash
# Check status before committing
git status
git diff

# Typical commit pattern (do NOT commit .env.local or generated files)
git add src/
git commit -m "feat: add new feature"

# Note: No automated hooks configured
```

## Critical Issues Documented

- **CODING_ERRORS.md**: Record of coding mistakes and lessons learned
  - Variable/function duplicate declarations
  - Server management issues
  - Auto-play logic failures
  - Chrome TTS compatibility issues
- **TTS_BROWSER_COMPATIBILITY.md**: Browser-specific TTS issues and solutions
- **PROJECT_STATUS.md**: Current project state, known issues, and TODO list

## Known Issues

### Chrome TTS Issues
- **Problem**: `speechSynthesis.speak()` may not produce sound even if code executes
- **Root Cause**: Chrome's speechSynthesis implementation differs from Safari
- **Solution**: Use Keep-Alive mechanism, simple calls, test thoroughly
- **Status**: Partially resolved - Keep-Alive works, but some scenarios still fail

### Audio Unlock Issues
- **Problem**: Browser autoplay policy blocks audio
- **Solution**: Always unlock on first user interaction
- **Pattern**: See unlockAudio() function for reference implementation
