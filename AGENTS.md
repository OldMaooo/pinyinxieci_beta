# AGENTS.md

Agentic coding guidelines for this repository.

## Build & Development Commands

```bash
# Development
npm run dev          # Start Vite dev server on 0.0.0.0:5175

# Testing Individual Features (no test framework configured)
# Approach 1: Manual testing in browser
# 1. Start dev server
npm run dev
# 2. Open http://localhost:5175
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

# Alternative dev port (if port 5175 occupied)
npm run dev -- --host 0.0.0.0 --port 5176

# Clean port before starting (if needed)
lsof -ti:5175 | xargs kill -9 2>/dev/null
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

## Production Deployment

### Project Structure

This project has **two** production environments:

#### Production (正式版)
- **GitHub Repository**: `https://github.com/OldMaooo/pinyinxieci`
- **Production URL**: `https://pinyinxieci.vercel.app`
- **Vercel Project ID**: `prj_pEg1a6a6aXJmft2NE7Z9FX7T7Qlk`
- **Git Remote Name**: `origin` (default)
- **Use For**: Stable releases, production features

#### Beta (测试版)
- **GitHub Repository**: `https://github.com/OldMaooo/pinyinxieci_beta`
- **Production URL**: `https://pinyinxieci-beta.vercel.app`
- **Vercel Project ID**: `prj_CHWwC561PEEkTkvkygz6K7a5E4x3`
- **Git Remote Name**: `beta`
- **Use For**: Testing new features, experimental changes

### Deployment Process

#### Deploy to Production (正式版)

```bash
# 1. Ensure on correct branch
git checkout main

# 2. Build for production
npm run build

# 3. Link to production Vercel project (if not already linked)
vercel link --yes

# 4. Deploy to production
vercel --prod --yes

# 5. Verify deployment
# Visit https://pinyinxieci.vercel.app
```

#### Deploy to Beta (测试版)

```bash
# 1. Add beta remote (if not already added)
git remote add beta https://github.com/OldMaooo/pinyinxieci_beta.git

# 2. Ensure on correct branch
git checkout main

# 3. Push to beta repository
git push -u beta main

# 4. Remove old Vercel config (to avoid linking to wrong project)
rm -rf .vercel

# 5. Configure Vercel project for beta
echo '{"projectId":"prj_CHWwC561PEEkTkvkygz6K7a5E4x3","orgId":"team_6Gv04HgiucktUZJbrz6DFPcE","projectName":"pinyinxieci_beta"}' > .vercel/project.json

# 6. Build for production
npm run build

# 7. Deploy to beta Vercel project
vercel --prod --yes

# 8. Verify deployment
# Visit https://pinyinxieci-beta.vercel.app
```

### Vercel Project Management

#### View All Deployments
```bash
# List all deployments in the current project
vercel ls

# View deployment logs
vercel inspect <deployment-url> --logs

# Redeploy a specific deployment
vercel redeploy <deployment-url>
```

### Important Notes

1. **Repository Separation**: Beta and production are separate GitHub repositories
2. **Vercel Projects**: Each has its own Vercel project with unique Project ID
3. **Domain Aliases**:
   - Production: `pinyinxieci.vercel.app` points to production project
   - Beta: `pinyinxieci-beta.vercel.app` points to beta project
4. **Workflow**:
   - Develop locally and test with `npm run dev`
   - Test on beta first by pushing to beta repository
   - After beta testing, push to production repository
   - Deploy to production Vercel project
5. **Local Git State**: Always work on local `main` branch, push to different remotes for deployment

### Common Issues & Solutions

#### Issue: Wrong Vercel Project Linked
**Symptom**: Deploying to production but code goes to beta (or vice versa)

**Solution**:
```bash
# Remove .vercel directory
rm -rf .vercel

# Re-link with correct project
vercel link --yes

# Verify correct project is linked
cat .vercel/project.json
```

#### Issue: Code Changes Lost After Deployment
**Symptom**: Previous code deployed instead of latest changes

**Solution**:
```bash
# Check current commit
git log --oneline -3

# If wrong, use reflog to find lost commits
git reflog | head -10

# Restore correct commit
git reset --hard <commit-hash>

# Push again
git push origin main  # or git push beta main for beta
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
