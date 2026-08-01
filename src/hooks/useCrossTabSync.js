import { useEffect, useRef } from 'react'
import { subscribeCrossTabEvents } from '../utils/crossTabSync'

/**
 * Subscribe to normalized cross-tab events with lifecycle-safe cleanup.
 * @param {(event: object) => void} handler
 * @param {{filter?: (event: object) => boolean, includeSelf?: boolean}} [options]
 */
export function useCrossTabSync(handler, options = {}) {
  const handlerRef = useRef(handler)
  const filterRef = useRef(options.filter)

  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    filterRef.current = options.filter
  }, [options.filter])

  useEffect(() => {
    return subscribeCrossTabEvents((event) => {
      if (
        typeof filterRef.current === 'function' &&
        !filterRef.current(event)
      ) {
        return
      }
      handlerRef.current?.(event)
    }, { includeSelf: options.includeSelf })
  }, [options.includeSelf])
}
