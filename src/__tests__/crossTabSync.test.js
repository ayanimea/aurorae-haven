import {
  getCrossTabSyncTabId,
  publishCrossTabEvent,
  subscribeCrossTabEvents
} from '../utils/crossTabSync'

describe('crossTabSync', () => {
  afterEach(() => {
    localStorage.clear()
    delete window.BroadcastChannel
  })

  test('delivers same-tab events when includeSelf is true', () => {
    const received = []
    const unsubscribe = subscribeCrossTabEvents(
      (event) => received.push(event),
      { includeSelf: true }
    )

    publishCrossTabEvent({
      domain: 'settings',
      action: 'updated',
      payload: { key: 'theme' }
    })

    expect(received).toHaveLength(1)
    expect(received[0]).toMatchObject({
      version: 1,
      domain: 'settings',
      action: 'updated',
      payload: { key: 'theme' }
    })

    unsubscribe()
  })

  test('ignores same-tab events when includeSelf is false', () => {
    const received = []
    const unsubscribe = subscribeCrossTabEvents((event) => received.push(event))

    publishCrossTabEvent({
      domain: 'tasks',
      action: 'updated',
      payload: {}
    })

    expect(received).toHaveLength(0)
    unsubscribe()
  })

  test('uses storage fallback for cross-tab messages without BroadcastChannel', () => {
    const received = []
    const unsubscribe = subscribeCrossTabEvents((event) => received.push(event))

    const externalEvent = {
      version: 1,
      eventId: 'event-1',
      timestamp: Date.now(),
      domain: 'routines',
      action: 'updated',
      payload: { source: 'test' },
      sourceTabId: 'different-tab-id'
    }

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'aurorae_sync_event',
        newValue: JSON.stringify(externalEvent)
      })
    )

    expect(received).toHaveLength(1)
    expect(received[0]).toMatchObject({
      domain: 'routines',
      action: 'updated',
      sourceTabId: 'different-tab-id'
    })
    expect(received[0].sourceTabId).not.toBe(getCrossTabSyncTabId())

    unsubscribe()
  })
})
