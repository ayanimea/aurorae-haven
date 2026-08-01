import { v4 as generateSecureUUID } from 'uuid'
import { createLogger } from './logger'

const logger = createLogger('CrossTabSync')

export const SYNC_EVENT_VERSION = 1
const CHANNEL_NAME = 'aurorae_sync'
const STORAGE_FALLBACK_KEY = 'aurorae_sync_event'
const WINDOW_EVENT_NAME = 'aurorae:sync'

const tabId = generateSecureUUID()
let broadcastChannel = null
const subscribers = new Set()
let listenersAttached = false

function ensureChannel() {
  if (broadcastChannel || typeof window === 'undefined') {
    return broadcastChannel
  }

  if (typeof window.BroadcastChannel !== 'function') {
    return null
  }

  broadcastChannel = new window.BroadcastChannel(CHANNEL_NAME)
  broadcastChannel.onmessage = (event) => {
    notifySubscribers(event?.data)
  }

  return broadcastChannel
}

function normalizeEvent(event) {
  if (!event || typeof event !== 'object') {
    return null
  }

  if (typeof event.domain !== 'string' || typeof event.action !== 'string') {
    return null
  }

  return {
    version: event.version ?? SYNC_EVENT_VERSION,
    domain: event.domain,
    action: event.action,
    payload: event.payload ?? {},
    timestamp: event.timestamp ?? Date.now(),
    sourceTabId: event.sourceTabId ?? tabId,
    eventId: event.eventId ?? generateSecureUUID()
  }
}

function notifySubscribers(rawEvent) {
  const event = normalizeEvent(rawEvent)
  if (!event) {
    return
  }

  subscribers.forEach((subscription) => {
    const { handler, filter, includeSelf } = subscription

    if (!includeSelf && event.sourceTabId === tabId) {
      return
    }

    if (typeof filter === 'function' && !filter(event)) {
      return
    }

    try {
      handler(event)
    } catch (error) {
      logger.error('Subscriber handler failed:', error)
    }
  })
}

function handleWindowEvent(event) {
  notifySubscribers(event?.detail)
}

function handleStorageEvent(event) {
  if (event?.key !== STORAGE_FALLBACK_KEY || !event.newValue) {
    return
  }

  try {
    notifySubscribers(JSON.parse(event.newValue))
  } catch (error) {
    logger.warn('Failed to parse storage sync event payload:', error)
  }
}

function ensureListeners() {
  if (typeof window === 'undefined') {
    return
  }

  if (!listenersAttached) {
    window.addEventListener(WINDOW_EVENT_NAME, handleWindowEvent)
    window.addEventListener('storage', handleStorageEvent)
    listenersAttached = true
  }

  ensureChannel()
}

function maybeDetachListeners() {
  if (typeof window === 'undefined') {
    return
  }

  if (subscribers.size !== 0) {
    return
  }

  if (listenersAttached) {
    window.removeEventListener(WINDOW_EVENT_NAME, handleWindowEvent)
    window.removeEventListener('storage', handleStorageEvent)
    listenersAttached = false
  }

  if (broadcastChannel) {
    broadcastChannel.close()
    broadcastChannel = null
  }
}

export function publishCrossTabEvent(event) {
  const normalized = normalizeEvent(event)
  if (!normalized) {
    return
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(WINDOW_EVENT_NAME, { detail: normalized }))
  }

  const channel = ensureChannel()
  if (channel) {
    channel.postMessage(normalized)
    return
  }

  try {
    localStorage.setItem(STORAGE_FALLBACK_KEY, JSON.stringify(normalized))
  } catch (error) {
    logger.warn('Failed to publish storage fallback event:', error)
  }
}

export function subscribeCrossTabEvents(handler, options = {}) {
  if (typeof handler !== 'function') {
    throw new Error('subscribeCrossTabEvents requires a handler function')
  }

  const { filter = null, includeSelf = false } = options
  const subscription = {
    handler,
    filter,
    includeSelf
  }

  subscribers.add(subscription)
  ensureListeners()

  return () => {
    subscribers.delete(subscription)
    maybeDetachListeners()
  }
}

export function getCrossTabSyncTabId() {
  return tabId
}
