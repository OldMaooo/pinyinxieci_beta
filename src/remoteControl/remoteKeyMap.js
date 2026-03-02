export const FLASH_ACTIONS = {
  NEXT: 'flash_next',
  TOGGLE_PLAY: 'flash_toggle_play',
  MARK_WRONG: 'flash_mark_wrong',
};

export const FLASH_ACTION_ORDER = [
  FLASH_ACTIONS.NEXT,
  FLASH_ACTIONS.TOGGLE_PLAY,
  FLASH_ACTIONS.MARK_WRONG,
];

function boolToInt(value) {
  return value ? 1 : 0;
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : '';
}

export function buildKeySignature(eventType, eventLike) {
  const key = eventLike?.key || '';
  const code = eventLike?.code || '';
  const keyCode = toNumber(eventLike?.keyCode ?? eventLike?.key_code);
  const whichCode = toNumber(eventLike?.which ?? eventLike?.which_code);
  const shift = boolToInt(Boolean(eventLike?.shiftKey ?? eventLike?.shift_key));
  const ctrl = boolToInt(Boolean(eventLike?.ctrlKey ?? eventLike?.ctrl_key));
  const alt = boolToInt(Boolean(eventLike?.altKey ?? eventLike?.alt_key));
  const meta = boolToInt(Boolean(eventLike?.metaKey ?? eventLike?.meta_key));

  return [eventType || '', key, code, keyCode, whichCode, shift, ctrl, alt, meta].join('|');
}

export function findMappedAction(mapping, signature) {
  if (!mapping || typeof mapping !== 'object' || !signature) {
    return null;
  }

  for (const action of FLASH_ACTION_ORDER) {
    if (mapping[action] === signature) {
      return action;
    }
  }

  return null;
}

export function normalizeFlashMapping(rawMapping) {
  if (!rawMapping || typeof rawMapping !== 'object' || Array.isArray(rawMapping)) {
    return {};
  }

  const normalized = {};
  for (const action of FLASH_ACTION_ORDER) {
    const value = rawMapping[action];
    if (typeof value === 'string' && value.trim()) {
      normalized[action] = value;
    }
  }

  return normalized;
}
