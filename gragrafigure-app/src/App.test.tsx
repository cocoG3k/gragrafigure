import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('shows the editor header', () => {
    render(<App />)
    expect(screen.getByText('Topology Graph Editor')).toBeInTheDocument()
  })
})
