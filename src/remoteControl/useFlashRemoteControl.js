import { useEffect, useRef, useState } from 'react';
import { buildKeySignature, findMappedAction, normalizeFlashMapping } from './remoteKeyMap.js';

const LOCAL_MAPPING_KEY = 'pinyin_remote_flash_map_v1';
const DEFAULT_PROFILE_ID = 'ipad-remote-default';

function getStoredProfileId() {
  if (typeof window === 'undefined') return DEFAULT_PROFILE_ID;
  return localStorage.getItem('pinyin_remote_profile_id') || DEFAULT_PROFILE_ID;
}

function loadLocalMapping() {
  if (typeof window === 'undefined') return {};

  try {
    const raw = localStorage.getItem(LOCAL_MAPPING_KEY);
    if (!raw) return {};
    return normalizeFlashMapping(JSON.parse(raw));
  } catch {
    return {};
  }
}

function reportMappedEvent(profileId, sessionId, signature, action, event) {
  if (typeof window === 'undefined') return;

  const payload = {
    profile_id: profileId,
    session_id: sessionId,
    page_context: 'flashcard',
    event_type: event.type,
    key: event.key || '',
    code: event.code || '',
    key_code: Number.isFinite(Number(event.keyCode)) ? Number(event.keyCode) : null,
    which_code: Number.isFinite(Number(event.which)) ? Number(event.which) : null,
    shift_key: !!event.shiftKey,
    ctrl_key: !!event.ctrlKey,
    alt_key: !!event.altKey,
    meta_key: !!event.metaKey,
    repeat_key: !!event.repeat,
    normalized_signature: signature,
    mapped_action: action,
    user_agent: navigator.userAgent,
  };

  fetch('/api/remote/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Keep the UI responsive even when local API is unreachable.
  });
}

export function useFlashRemoteControl({ enabled = true, profileId, handlers, debounceMs = 250 }) {
  const effectiveProfileId = profileId || getStoredProfileId();

  const [mapping, setMapping] = useState(() => loadLocalMapping());
  const mappingRef = useRef(mapping);
  const handlersRef = useRef(handlers || {});
  const lastTriggerAtRef = useRef(0);
  const sessionIdRef = useRef(`flash-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`);

  useEffect(() => {
    mappingRef.current = mapping;
  }, [mapping]);

  useEffect(() => {
    handlersRef.current = handlers || {};
  }, [handlers]);

  useEffect(() => {
    const local = loadLocalMapping();
    if (Object.keys(local).length > 0) {
      setMapping(local);
    }

    fetch(`/api/remote/mapping?profile_id=${encodeURIComponent(effectiveProfileId)}`)
      .then((resp) => {
        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`);
        }
        return resp.json();
      })
      .then((data) => {
        const nextMapping = normalizeFlashMapping(data.mapping);
        if (Object.keys(nextMapping).length > 0) {
          localStorage.setItem(LOCAL_MAPPING_KEY, JSON.stringify(nextMapping));
          setMapping(nextMapping);
        }
      })
      .catch(() => {
        // Fallback to local mapping only.
      });
  }, [effectiveProfileId]);

  useEffect(() => {
    if (!enabled) return undefined;

    const onKeyDown = (event) => {
      if (event.repeat) return;

      const signature = buildKeySignature('keydown', event);
      const action = findMappedAction(mappingRef.current, signature);
      if (!action) return;

      const now = Date.now();
      if (now - lastTriggerAtRef.current < debounceMs) {
        return;
      }
      lastTriggerAtRef.current = now;

      event.preventDefault();
      event.stopPropagation();

      const handler = handlersRef.current?.[action];
      if (typeof handler === 'function') {
        handler();
      }

      reportMappedEvent(effectiveProfileId, sessionIdRef.current, signature, action, event);
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, [enabled, debounceMs, effectiveProfileId]);

  return { mapping };
}
