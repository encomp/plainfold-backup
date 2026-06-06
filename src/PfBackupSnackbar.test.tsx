import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ReactNode } from 'react'
import { PfBackupSnackbar } from './PfBackupSnackbar'
import { BackupContext } from './backup-context'

function createWrapper(overrides?: Partial<React.ComponentProps<typeof BackupContext.Provider>['value']>) {
  const defaultValue = {
    appName: 'test-app',
    openCount: 1,
    lastExport: null,
    lastReminder: null,
    shouldRemind: false,
    dismissReminder: vi.fn(),
    ...overrides,
  }

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <BackupContext.Provider value={defaultValue}>
        {children}
      </BackupContext.Provider>
    )
  }
}

describe('PfBackupSnackbar', () => {
  it('does not render when shouldRemind is false', () => {
    render(<PfBackupSnackbar />, { wrapper: createWrapper({ shouldRemind: false }) })
    expect(screen.queryByTestId('backup-snackbar')).not.toBeInTheDocument()
  })

  it('renders when shouldRemind is true', () => {
    render(<PfBackupSnackbar />, { wrapper: createWrapper({ shouldRemind: true }) })
    expect(screen.getByTestId('backup-snackbar')).toBeInTheDocument()
  })

  it('shows first-time message when no lastExport', () => {
    render(<PfBackupSnackbar />, {
      wrapper: createWrapper({ shouldRemind: true, lastExport: null }),
    })
    expect(screen.getByText(/haven't backed up yet/)).toBeInTheDocument()
  })

  it('shows reminder message when lastExport exists', () => {
    render(<PfBackupSnackbar />, {
      wrapper: createWrapper({ shouldRemind: true, lastExport: '2025-01-01' }),
    })
    expect(screen.getByText('Time to back up your data.')).toBeInTheDocument()
  })

  it('dismisses when dismiss button is clicked', () => {
    const dismissReminder = vi.fn()
    render(<PfBackupSnackbar />, {
      wrapper: createWrapper({ shouldRemind: true, dismissReminder }),
    })

    fireEvent.click(screen.getByText('Dismiss'))
    expect(dismissReminder).toHaveBeenCalled()
    expect(screen.queryByTestId('backup-snackbar')).not.toBeInTheDocument()
  })
})
