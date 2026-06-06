import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { PfBackupProvider } from './PfBackupProvider'
import { useBackupContext } from './backup-context'

// Mock @plainfold/store
const mockStore: Record<string, unknown> = {}
vi.mock('@plainfold/store', () => ({
  Settings: {
    get: vi.fn(async (key: string) => mockStore[key]),
    set: vi.fn(async (key: string, value: unknown) => {
      mockStore[key] = value
      return key
    }),
    remove: vi.fn(async (key: string) => {
      delete mockStore[key]
    }),
  },
}))

function ContextReader() {
  const ctx = useBackupContext()
  return (
    <div>
      <span data-testid="open-count">{ctx.openCount}</span>
      <span data-testid="should-remind">{String(ctx.shouldRemind)}</span>
      <span data-testid="last-export">{ctx.lastExport ?? 'none'}</span>
      <span data-testid="app-name">{ctx.appName}</span>
    </div>
  )
}

describe('PfBackupProvider', () => {
  beforeEach(() => {
    for (const key of Object.keys(mockStore)) {
      delete mockStore[key]
    }
  })

  it('renders children after initialization', async () => {
    render(
      <PfBackupProvider appName="test-app">
        <div data-testid="child">Hello</div>
      </PfBackupProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('child')).toBeInTheDocument()
    })
    expect(screen.getByTestId('child')).toHaveTextContent('Hello')
  })

  it('increments open count on mount', async () => {
    render(
      <PfBackupProvider appName="test-app">
        <ContextReader />
      </PfBackupProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('open-count')).toHaveTextContent('1')
    })
  })

  it('accumulates open count across renders', async () => {
    mockStore['pf:backup:openCount'] = 3

    render(
      <PfBackupProvider appName="test-app">
        <ContextReader />
      </PfBackupProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('open-count')).toHaveTextContent('4')
    })
  })

  it('evaluates open-count reminder rule', async () => {
    mockStore['pf:backup:openCount'] = 4

    render(
      <PfBackupProvider
        appName="test-app"
        reminderRules={[{ type: 'open-count', threshold: 5 }]}
      >
        <ContextReader />
      </PfBackupProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('should-remind')).toHaveTextContent('true')
    })
  })

  it('does not remind when threshold not met', async () => {
    mockStore['pf:backup:openCount'] = 1

    render(
      <PfBackupProvider
        appName="test-app"
        reminderRules={[{ type: 'open-count', threshold: 5 }]}
      >
        <ContextReader />
      </PfBackupProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('should-remind')).toHaveTextContent('false')
    })
  })

  it('evaluates days-since-export rule', async () => {
    const oldDate = new Date(Date.now() - 31 * 86400000).toISOString()
    mockStore['pf:backup:lastExport'] = oldDate

    render(
      <PfBackupProvider
        appName="test-app"
        reminderRules={[{ type: 'days-since-export', threshold: 30 }]}
      >
        <ContextReader />
      </PfBackupProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('should-remind')).toHaveTextContent('true')
    })
  })

  it('passes appName through context', async () => {
    render(
      <PfBackupProvider appName="my-app">
        <ContextReader />
      </PfBackupProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('app-name')).toHaveTextContent('my-app')
    })
  })
})
