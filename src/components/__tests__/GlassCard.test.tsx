import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import GlassCard from '../GlassCard'

describe('GlassCard', () => {
  it('renders children correctly', () => {
    render(
      <GlassCard>
        <div data-testid="child">Test Content</div>
      </GlassCard>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const customClass = 'custom-test-class'
    const { container } = render(
      <GlassCard className={customClass}>
        <div>Test Content</div>
      </GlassCard>
    )

    expect(container.firstChild).toHaveClass(customClass)
  })

  it('has glassmorphism styles by default', () => {
    const { container } = render(
      <GlassCard>
        <div>Test Content</div>
      </GlassCard>
    )

    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('bg-white/10')
    expect(card).toHaveClass('backdrop-blur-xl')
    expect(card).toHaveClass('border-white/20')
  })

  it('applies hover effect when hover is true', () => {
    const { container } = render(
      <GlassCard hover={true}>
        <div>Test Content</div>
      </GlassCard>
    )

    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('hover:bg-white/20')
  })

  it('does not apply hover effect when hover is false', () => {
    const { container } = render(
      <GlassCard hover={false}>
        <div>Test Content</div>
      </GlassCard>
    )

    const card = container.firstChild as HTMLElement
    expect(card).not.toHaveClass('hover:bg-white/20')
  })

  it('applies glow effect when glow is true', () => {
    const { container } = render(
      <GlassCard glow={true}>
        <div>Test Content</div>
      </GlassCard>
    )

    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('shadow-white/20')
  })

  it('applies cursor-pointer when onClick is provided', () => {
    const { container } = render(
      <GlassCard onClick={() => {}}>
        <div>Test Content</div>
      </GlassCard>
    )

    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('cursor-pointer')
  })

  it('is clickable when onClick is provided', () => {
    const mockOnClick = jest.fn()
    const { container } = render(
      <GlassCard onClick={mockOnClick}>
        <div>Test Content</div>
      </GlassCard>
    )

    const card = container.firstChild as HTMLElement
    card.click()
    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('has proper accessibility attributes', () => {
    render(
      <GlassCard>
        <div>Test Content</div>
      </GlassCard>
    )

    // The card should be focusable if it has an onClick
    const { container } = render(
      <GlassCard onClick={() => {}}>
        <div>Test Content</div>
      </GlassCard>
    )

    const card = container.firstChild as HTMLElement
    expect(card).toHaveAttribute('tabIndex', '0')
  })
})