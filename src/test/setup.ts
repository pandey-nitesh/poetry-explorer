import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Vitest runs files in isolation, but React Testing Library mounts into a shared
// jsdom document — unmount between tests so queries don't see stale nodes.
afterEach(() => {
  cleanup()
})
