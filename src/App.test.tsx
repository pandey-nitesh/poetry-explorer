import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App', () => {
  it('renders the app title on the home route', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { name: /poetry explorer/i }),
    ).toBeInTheDocument()
  })

  it('renders the not-found screen for an unknown route', () => {
    window.history.pushState({}, '', '/does-not-exist')
    render(<App />)
    expect(
      screen.getByRole('heading', { name: /page not found/i }),
    ).toBeInTheDocument()
    window.history.pushState({}, '', '/')
  })
})
