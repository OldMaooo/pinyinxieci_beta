# Issues - MD to JSON Conversion

## [2026-02-07] App.jsx Restoration Required

**Issue**: Code was corrupted by previous sed commands from continue-vocab-expansion plan

**Action Taken**: Restored original App.jsx from git using \`git checkout src/App.jsx\`

**Result**: App.jsx now uses original code without lessonName field modifications

**Note**: The lessonName display feature was not implemented because the code was restored to original state. The current code uses "单元X" format for unit names.

**Current App Status**:
- Dev server runs successfully on port 3009
- No console errors when loading
- Application displays correctly
