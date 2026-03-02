import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const STORAGE_DIR = path.resolve(__dirname, 'storage')
const MASTERY_FILE = path.join(STORAGE_DIR, 'mastery.json')
const REMOTE_EVENTS_FILE = path.join(STORAGE_DIR, 'remote-key-events.jsonl')
const REMOTE_MAPPINGS_FILE = path.join(STORAGE_DIR, 'remote-key-mappings.json')
const MONITOR_SIGNALS_FILE = path.join(STORAGE_DIR, 'monitor-signals.jsonl')
const MONITOR_ACTIONS_FILE = path.join(STORAGE_DIR, 'monitor-actions.jsonl')
const REMOTE_BUFFER_SIZE = 1000
const MONITOR_BUFFER_SIZE = 5000

function ensureStorageDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true })
  }
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk.toString()
    })
    req.on('end', () => {
      resolve(body)
    })
    req.on('error', reject)
  })
}

function toIntOrNull(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function toBool(value) {
  return value === true || value === 'true' || value === 1 || value === '1'
}

function boolToInt(value) {
  return value ? 1 : 0
}

function buildSignature(eventType, eventLike) {
  const keyCode = toIntOrNull(eventLike.key_code)
  const whichCode = toIntOrNull(eventLike.which_code)
  return [
    eventType || '',
    eventLike.key || '',
    eventLike.code || '',
    keyCode ?? '',
    whichCode ?? '',
    boolToInt(toBool(eventLike.shift_key)),
    boolToInt(toBool(eventLike.ctrl_key)),
    boolToInt(toBool(eventLike.alt_key)),
    boolToInt(toBool(eventLike.meta_key)),
  ].join('|')
}

function loadMappingsFile() {
  if (!fs.existsSync(REMOTE_MAPPINGS_FILE)) {
    return {}
  }

  try {
    const raw = fs.readFileSync(REMOTE_MAPPINGS_FILE, 'utf-8')
    if (!raw.trim()) return {}

    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.reduce((acc, item) => {
        if (item && item.profile_id) {
          acc[item.profile_id] = item
        }
        return acc
      }, {})
    }

    if (parsed && typeof parsed === 'object') {
      return parsed
    }
  } catch (error) {
    console.error('[local-storage-api] Failed to parse mapping file:', error)
  }

  return {}
}

function loadEventsFile() {
  if (!fs.existsSync(REMOTE_EVENTS_FILE)) {
    return { events: [], maxId: 0 }
  }

  const lines = fs.readFileSync(REMOTE_EVENTS_FILE, 'utf-8').split('\n').filter(Boolean)
  const parsed = []
  let maxId = 0

  for (const line of lines) {
    try {
      const event = JSON.parse(line)
      if (event && typeof event === 'object') {
        const eventId = toIntOrNull(event.id)
        if (eventId !== null) {
          maxId = Math.max(maxId, eventId)
          parsed.push(event)
        }
      }
    } catch {
      // Ignore malformed history lines.
    }
  }

  return {
    events: parsed.slice(-REMOTE_BUFFER_SIZE),
    maxId,
  }
}

function loadJsonlFile(filePath, limit) {
  if (!fs.existsSync(filePath)) {
    return { rows: [], maxId: 0 }
  }

  const lines = fs.readFileSync(filePath, 'utf-8').split('\n').filter(Boolean)
  const rows = []
  let maxId = 0

  for (const line of lines) {
    try {
      const row = JSON.parse(line)
      if (row && typeof row === 'object') {
        const id = toIntOrNull(row.id)
        if (id !== null) {
          maxId = Math.max(maxId, id)
          rows.push(row)
        }
      }
    } catch {
      // Ignore malformed history lines.
    }
  }

  return {
    rows: rows.slice(-limit),
    maxId,
  }
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-storage-api',
      configureServer(server) {
        ensureStorageDir()

        const loadedEvents = loadEventsFile()
        let remoteEvents = loadedEvents.events
        let remoteEventId = loadedEvents.maxId
        let remoteMappings = loadMappingsFile()
        const loadedSignals = loadJsonlFile(MONITOR_SIGNALS_FILE, MONITOR_BUFFER_SIZE)
        const loadedActions = loadJsonlFile(MONITOR_ACTIONS_FILE, MONITOR_BUFFER_SIZE)
        let monitorSignals = loadedSignals.rows
        let monitorActions = loadedActions.rows
        let monitorSignalId = loadedSignals.maxId
        let monitorActionId = loadedActions.maxId
        const sseClients = new Set()

        const heartbeat = setInterval(() => {
          for (const client of sseClients) {
            try {
              client.res.write(': ping\n\n')
            } catch {
              sseClients.delete(client)
            }
          }
        }, 15000)

        server.httpServer?.once('close', () => clearInterval(heartbeat))

        function broadcastSse(eventName, payload) {
          const data = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`
          for (const client of sseClients) {
            const { sessionId, profileId } = client
            const payloadSession = payload?.session_id || ''
            const payloadProfile = payload?.profile_id || ''

            if (sessionId && payloadSession && payloadSession !== sessionId) continue
            if (profileId && payloadProfile && payloadProfile !== profileId) continue

            try {
              client.res.write(data)
            } catch {
              sseClients.delete(client)
            }
          }
        }

        function attachSse(req, res, reqUrl) {
          const sessionId = reqUrl.searchParams.get('session_id') || ''
          const profileId = reqUrl.searchParams.get('profile_id') || ''

          res.writeHead(200, {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
          })

          const client = { res, sessionId, profileId }
          sseClients.add(client)
          res.write(`event: hello\ndata: ${JSON.stringify({ ok: true, session_id: sessionId || null, profile_id: profileId || null })}\n\n`)

          req.on('close', () => {
            sseClients.delete(client)
          })
        }

        function appendRemoteEvent(eventPayload) {
          const event = {
            id: ++remoteEventId,
            created_at: new Date().toISOString(),
            ...eventPayload,
          }

          remoteEvents.push(event)
          if (remoteEvents.length > REMOTE_BUFFER_SIZE) {
            remoteEvents = remoteEvents.slice(-REMOTE_BUFFER_SIZE)
          }

          fs.appendFileSync(REMOTE_EVENTS_FILE, `${JSON.stringify(event)}\n`, 'utf-8')
          broadcastSse('event', event)
          return event
        }

        function upsertMapping(profileId, mapping, updatedFrom = 'lab') {
          const record = {
            profile_id: profileId,
            mapping,
            updated_at: new Date().toISOString(),
            updated_from: updatedFrom,
          }

          remoteMappings[profileId] = record
          fs.writeFileSync(REMOTE_MAPPINGS_FILE, JSON.stringify(remoteMappings, null, 2), 'utf-8')
          broadcastSse('mapping', record)
          return record
        }

        function appendMonitorSignal(signalPayload) {
          const signal = {
            id: ++monitorSignalId,
            created_at: new Date().toISOString(),
            ...signalPayload,
          }

          monitorSignals.push(signal)
          if (monitorSignals.length > MONITOR_BUFFER_SIZE) {
            monitorSignals = monitorSignals.slice(-MONITOR_BUFFER_SIZE)
          }

          fs.appendFileSync(MONITOR_SIGNALS_FILE, `${JSON.stringify(signal)}\n`, 'utf-8')
          broadcastSse('monitor_signal', signal)
          return signal
        }

        function appendMonitorAction(actionPayload) {
          const action = {
            id: ++monitorActionId,
            created_at: new Date().toISOString(),
            ...actionPayload,
          }

          monitorActions.push(action)
          if (monitorActions.length > MONITOR_BUFFER_SIZE) {
            monitorActions = monitorActions.slice(-MONITOR_BUFFER_SIZE)
          }

          fs.appendFileSync(MONITOR_ACTIONS_FILE, `${JSON.stringify(action)}\n`, 'utf-8')
          broadcastSse('monitor_action', action)
          return action
        }

        server.middlewares.use(async (req, res, next) => {
          try {
            const reqUrl = new URL(req.url || '/', 'http://127.0.0.1')
            const pathname = reqUrl.pathname

            // 处理保存请求
            if (pathname === '/api/save-mastery' && req.method === 'POST') {
              const body = await parseRequestBody(req)
              fs.writeFileSync(MASTERY_FILE, body, 'utf-8')
              sendJson(res, 200, { status: 'success' })
              return
            }

            // 处理读取请求
            if (pathname === '/api/load-mastery' && req.method === 'GET') {
              if (fs.existsSync(MASTERY_FILE)) {
                const data = fs.readFileSync(MASTERY_FILE, 'utf-8')
                res.setHeader('Content-Type', 'application/json; charset=utf-8')
                res.end(data)
              } else {
                sendJson(res, 200, {})
              }
              return
            }

            if (pathname === '/api/remote/stream' && req.method === 'GET') {
              attachSse(req, res, reqUrl)
              return
            }

            if (pathname === '/api/monitor/stream' && req.method === 'GET') {
              attachSse(req, res, reqUrl)
              return
            }

            if (pathname === '/api/remote/events' && req.method === 'POST') {
              const raw = await parseRequestBody(req)
              let body
              try {
                body = JSON.parse(raw || '{}')
              } catch {
                sendJson(res, 400, { error: 'Invalid JSON body' })
                return
              }

              const normalized = {
                profile_id: String(body.profile_id || 'ipad-remote-default'),
                session_id: String(body.session_id || 'unknown-session'),
                page_context: String(body.page_context || 'lab'),
                event_type: String(body.event_type || 'keydown'),
                key: body.key == null ? '' : String(body.key),
                code: body.code == null ? '' : String(body.code),
                key_code: toIntOrNull(body.key_code),
                which_code: toIntOrNull(body.which_code),
                shift_key: toBool(body.shift_key),
                ctrl_key: toBool(body.ctrl_key),
                alt_key: toBool(body.alt_key),
                meta_key: toBool(body.meta_key),
                repeat_key: toBool(body.repeat_key),
                mapped_action: body.mapped_action ? String(body.mapped_action) : null,
                user_agent: body.user_agent == null ? '' : String(body.user_agent),
              }

              normalized.normalized_signature = body.normalized_signature
                ? String(body.normalized_signature)
                : buildSignature(normalized.event_type, normalized)

              const inserted = appendRemoteEvent(normalized)
              sendJson(res, 200, { ok: true, event: inserted })
              return
            }

            if (pathname === '/api/remote/events' && req.method === 'GET') {
              const limitParam = Number(reqUrl.searchParams.get('limit') || 200)
              const limit = Number.isFinite(limitParam)
                ? Math.max(1, Math.min(1000, Math.floor(limitParam)))
                : 200
              const afterId = toIntOrNull(reqUrl.searchParams.get('after_id')) || 0
              const sessionId = reqUrl.searchParams.get('session_id') || ''
              const profileId = reqUrl.searchParams.get('profile_id') || ''

              let filtered = remoteEvents
              if (afterId > 0) filtered = filtered.filter((event) => event.id > afterId)
              if (sessionId) filtered = filtered.filter((event) => event.session_id === sessionId)
              if (profileId) filtered = filtered.filter((event) => event.profile_id === profileId)

              filtered = filtered.slice(-limit)
              const lastId = filtered.length > 0 ? filtered[filtered.length - 1].id : afterId

              sendJson(res, 200, { ok: true, events: filtered, last_id: lastId })
              return
            }

            if (pathname === '/api/remote/mapping' && req.method === 'GET') {
              const profileId = reqUrl.searchParams.get('profile_id') || 'ipad-remote-default'
              const record = remoteMappings[profileId] || {
                profile_id: profileId,
                mapping: null,
                updated_at: null,
                updated_from: null,
              }
              sendJson(res, 200, { ok: true, ...record })
              return
            }

            if (pathname === '/api/remote/mapping' && req.method === 'PUT') {
              const raw = await parseRequestBody(req)
              let body
              try {
                body = JSON.parse(raw || '{}')
              } catch {
                sendJson(res, 400, { error: 'Invalid JSON body' })
                return
              }

              const profileId = String(body.profile_id || 'ipad-remote-default')
              const mapping = body.mapping
              if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping)) {
                sendJson(res, 400, { error: 'mapping must be an object' })
                return
              }

              const updatedFrom = body.updated_from ? String(body.updated_from) : 'lab'
              const record = upsertMapping(profileId, mapping, updatedFrom)
              sendJson(res, 200, { ok: true, ...record })
              return
            }

            if (pathname === '/api/monitor/signal' && req.method === 'POST') {
              const raw = await parseRequestBody(req)
              let body
              try {
                body = JSON.parse(raw || '{}')
              } catch {
                sendJson(res, 400, { error: 'Invalid JSON body' })
                return
              }

              const signal = appendMonitorSignal({
                profile_id: String(body.profile_id || 'ipad-remote-default'),
                session_id: String(body.session_id || 'unknown-session'),
                page_context: String(body.page_context || 'flashcard'),
                signal_type: String(body.signal_type || 'keydown'),
                key: body.key == null ? '' : String(body.key),
                code: body.code == null ? '' : String(body.code),
                repeat_key: toBool(body.repeat_key),
                expected_action: body.expected_action ? String(body.expected_action) : null,
                note: body.note ? String(body.note) : '',
                user_agent: body.user_agent ? String(body.user_agent) : '',
                captured_at: body.captured_at ? String(body.captured_at) : null,
              })
              sendJson(res, 200, { ok: true, signal })
              return
            }

            if (pathname === '/api/monitor/action' && req.method === 'POST') {
              const raw = await parseRequestBody(req)
              let body
              try {
                body = JSON.parse(raw || '{}')
              } catch {
                sendJson(res, 400, { error: 'Invalid JSON body' })
                return
              }

              const action = appendMonitorAction({
                profile_id: String(body.profile_id || 'ipad-remote-default'),
                session_id: String(body.session_id || 'unknown-session'),
                page_context: String(body.page_context || 'flashcard'),
                action: body.action ? String(body.action) : null,
                source: body.source ? String(body.source) : 'unknown',
                active_index: toIntOrNull(body.active_index),
                word_id: body.word_id ? String(body.word_id) : null,
                word: body.word ? String(body.word) : null,
                is_playing_before: typeof body.is_playing_before === 'boolean' ? body.is_playing_before : null,
                executed_at: body.executed_at ? String(body.executed_at) : null,
              })
              sendJson(res, 200, { ok: true, action })
              return
            }

            if (pathname === '/api/monitor/signals' && req.method === 'GET') {
              const limitParam = Number(reqUrl.searchParams.get('limit') || 200)
              const limit = Number.isFinite(limitParam)
                ? Math.max(1, Math.min(2000, Math.floor(limitParam)))
                : 200
              const afterId = toIntOrNull(reqUrl.searchParams.get('after_id')) || 0
              const sessionId = reqUrl.searchParams.get('session_id') || ''
              const profileId = reqUrl.searchParams.get('profile_id') || ''

              let filtered = monitorSignals
              if (afterId > 0) filtered = filtered.filter((row) => row.id > afterId)
              if (sessionId) filtered = filtered.filter((row) => row.session_id === sessionId)
              if (profileId) filtered = filtered.filter((row) => row.profile_id === profileId)
              filtered = filtered.slice(-limit)
              const lastId = filtered.length > 0 ? filtered[filtered.length - 1].id : afterId

              sendJson(res, 200, { ok: true, signals: filtered, last_id: lastId })
              return
            }

            if (pathname === '/api/monitor/actions' && req.method === 'GET') {
              const limitParam = Number(reqUrl.searchParams.get('limit') || 200)
              const limit = Number.isFinite(limitParam)
                ? Math.max(1, Math.min(2000, Math.floor(limitParam)))
                : 200
              const afterId = toIntOrNull(reqUrl.searchParams.get('after_id')) || 0
              const sessionId = reqUrl.searchParams.get('session_id') || ''
              const profileId = reqUrl.searchParams.get('profile_id') || ''

              let filtered = monitorActions
              if (afterId > 0) filtered = filtered.filter((row) => row.id > afterId)
              if (sessionId) filtered = filtered.filter((row) => row.session_id === sessionId)
              if (profileId) filtered = filtered.filter((row) => row.profile_id === profileId)
              filtered = filtered.slice(-limit)
              const lastId = filtered.length > 0 ? filtered[filtered.length - 1].id : afterId

              sendJson(res, 200, { ok: true, actions: filtered, last_id: lastId })
              return
            }

            if (pathname === '/api/monitor/report' && req.method === 'GET') {
              const sessionId = reqUrl.searchParams.get('session_id') || ''
              const profileId = reqUrl.searchParams.get('profile_id') || ''
              const windowMsRaw = Number(reqUrl.searchParams.get('window_ms') || 400)
              const windowMs = Number.isFinite(windowMsRaw) ? Math.max(50, Math.min(5000, Math.floor(windowMsRaw))) : 400

              let signals = monitorSignals
              let actions = monitorActions
              if (sessionId) {
                signals = signals.filter((row) => row.session_id === sessionId)
                actions = actions.filter((row) => row.session_id === sessionId)
              }
              if (profileId) {
                signals = signals.filter((row) => row.profile_id === profileId)
                actions = actions.filter((row) => row.profile_id === profileId)
              }

              const signalRows = [...signals].slice(-1000)
              const actionRows = [...actions].slice(-1000)
              const mismatchedSignals = []
              const matchedSignals = []
              const orphanActions = []
              const reasons = {
                no_action_after_signal: 0,
                different_action_executed: 0,
                orphan_shortcut_action: 0,
              }
              const consumedSignalIds = new Set()

              const expectedSignals = signalRows
                .map((signal) => {
                  const signalTs = Date.parse(signal.created_at || signal.captured_at || '')
                  return {
                    ...signal,
                    _ts: signalTs,
                  }
                })
                .filter((signal) => signal.expected_action && Number.isFinite(signal._ts))

              const shortcutActions = actionRows
                .map((action) => {
                  const actionTs = Date.parse(action.created_at || action.executed_at || '')
                  return {
                    ...action,
                    _ts: actionTs,
                  }
                })
                .filter((action) => String(action.source || '').startsWith('shortcut_') && Number.isFinite(action._ts))

              const isSourceExpectedCompatible = (source, expectedAction) => {
                const sourceText = String(source || '')
                if (sourceText.startsWith('shortcut_arrowdown')) {
                  return expectedAction === 'flash_next_or_mark_wrong' || expectedAction === 'flash_next_or_toggle_play'
                }
                if (sourceText === 'shortcut_arrowup') {
                  return expectedAction === 'flash_toggle_play' || expectedAction === 'flash_mark_wrong'
                }
                if (sourceText === 'shortcut_tab') {
                  return expectedAction === 'flash_toggle_play' || expectedAction === 'flash_prev'
                }
                if (sourceText === 'shortcut_tab_prev') {
                  return expectedAction === 'flash_prev'
                }
                return false
              }

              const isExpectedActualCompatible = (expectedAction, actualAction) => {
                if (expectedAction === 'flash_next_or_toggle_play') {
                  return actualAction === 'flash_next' || actualAction === 'flash_toggle_play'
                }
                if (expectedAction === 'flash_next_or_mark_wrong') {
                  return actualAction === 'flash_next' || actualAction === 'flash_mark_wrong'
                }
                return actualAction === expectedAction
              }

              for (const action of shortcutActions) {
                const candidates = expectedSignals.filter((signal) => {
                  if (consumedSignalIds.has(signal.id)) return false
                  if (!isSourceExpectedCompatible(action.source, signal.expected_action)) return false
                  return Math.abs(action._ts - signal._ts) <= windowMs
                })

                if (candidates.length === 0) {
                  orphanActions.push({
                    action_id: action.id,
                    action: action.action,
                    source: action.source,
                    reason: '检测到快捷键触发动作，但没有找到对应遥控信号',
                  })
                  continue
                }

                const pickedSignal = candidates.reduce((best, current) => {
                  if (!best) return current
                  const bestDistance = Math.abs(action._ts - best._ts)
                  const currentDistance = Math.abs(action._ts - current._ts)
                  if (currentDistance < bestDistance) return current
                  if (currentDistance === bestDistance && current.id < best.id) return current
                  return best
                }, null)

                consumedSignalIds.add(pickedSignal.id)
                const expected = pickedSignal.expected_action
                const actual = action.action || ''
                const acceptable = isExpectedActualCompatible(expected, actual)

                if (acceptable) {
                  matchedSignals.push({
                    signal_id: pickedSignal.id,
                    action_id: action.id,
                    expected_action: expected,
                    actual_action: actual,
                  })
                } else {
                  reasons.different_action_executed += 1
                  mismatchedSignals.push({
                    signal_id: pickedSignal.id,
                    action_id: action.id,
                    expected_action: expected,
                    actual_action: actual,
                    reason: '动作已执行但与遥控信号预期不一致',
                  })
                }
              }

              const unmatchedSignals = expectedSignals
                .filter((signal) => !consumedSignalIds.has(signal.id))
                .map((signal) => ({
                  signal_id: signal.id,
                  key: signal.key,
                  expected_action: signal.expected_action,
                  note: signal.note || '',
                  reason: '检测到遥控信号，但窗口期内没有动作执行',
                }))

              reasons.no_action_after_signal = unmatchedSignals.length
              reasons.orphan_shortcut_action = orphanActions.length

              sendJson(res, 200, {
                ok: true,
                matching_mode: 'nearest_bidirectional_v2',
                window_ms_used: windowMs,
                summary: {
                  profile_id: profileId || null,
                  session_id: sessionId || null,
                  signal_count: signalRows.length,
                  action_count: actionRows.length,
                  matched_count: matchedSignals.length,
                  unmatched_signal_count: unmatchedSignals.length,
                  mismatched_signal_count: mismatchedSignals.length,
                  orphan_shortcut_action_count: orphanActions.length,
                },
                reasons,
                unmatched_signals: unmatchedSignals.slice(-50),
                mismatched_signals: mismatchedSignals.slice(-50),
                orphan_shortcut_actions: orphanActions.slice(-50),
                latest_signals: signalRows.slice(-50),
                latest_actions: actionRows.slice(-50),
              })
              return
            }

            next()
          } catch (err) {
            sendJson(res, 500, { error: err.message || 'Unknown server error' })
          }
        })
      }
    }
  ],
  server: {
    host: '0.0.0.0',
    port: 3008,
  }
})
