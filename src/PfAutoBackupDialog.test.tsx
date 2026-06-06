import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ReactNode } from 'react'
import { PfAutoBackupDialog } from './PfAutoBackupDialog'
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

describe('PfAutoBackupDialog', () => {
  it('does not render when openCount is below threshold', () => {
    render(<PfAutoBackupDialog onExport={vi.fn()} triggerAtCount={5} />, {
      wrapper: createWrapper({ openCount: 3 }),
    })
    expect(screen.queryByTestId('auto-backup-dialog')).not.toBeInTheDocument()
  })

  it('renders when openCount reaches threshold', () => {
    render(<PfAutoBackupDialog onExport={vi.fn()} triggerAtCount={5} />, {
      wrapper: createWrapper({ openCount: 5 }),
    })
    expect(screen.getByTestId('auto-backup-dialog')).toBeInTheDocument()
  })

  it('does not render when lastExport exists', () => {
    render(<PfAutoBackupDialog onExport={vi.fn()} triggerAtCount={5} />, {
      wrapper: createWrapper({ openCount: 10, lastExport: '2025-01-01' }),
    })
    expect(screen.queryByTestId('auto-backup-dialog')).not.toBeInTheDocument()
  })

  it('calls onExport when Export Now is clicked', () => {
    const onExport = vi.fn()
    render(<PfAutoBackupDialog onExport={onExport} triggerAtCount={5} />, {
      wrapper: createWrapper({ openCount: 5 }),
    })

    fireEvent.click(screen.getByTestId('auto-backup-export'))
    expect(onExport).toHaveBeenCalled()
    expect(screen.queryByTestId('auto-backup-dialog')).not.toBeInTheDocument()
  })

  it('dismisses when Later is clicked', () => {
    const dismissReminder = vi.fn()
    render(<PfAutoBackupDialog onExport={vi.fn()} triggerAtCount={5} />, {
      wrapper: createWrapper({ openCount: 5, dismissReminder }),
    })

    fireEvent.click(screen.getByText('Later'))
    expect(dismissReminder).toHaveBeenCalled()
    expect(screen.queryByTestId('auto-backup-dialog')).not.toBeInTheDocument()
  })
})
