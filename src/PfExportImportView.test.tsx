import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import Dexie from 'dexie'
import { PfExportImportView } from './PfExportImportView'
import { BackupContext } from './backup-context'

// Mock @plainfold/store
vi.mock('@plainfold/store', () => ({
  Settings: {
    get: vi.fn(async () => undefined),
    set: vi.fn(async (key: string) => key),
    remove: vi.fn(async () => {}),
  },
}))

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

describe('PfExportImportView', () => {
  let testDb: Dexie

  beforeEach(async () => {
    testDb = new Dexie('test-export-import-db')
    testDb.version(1).stores({ items: '++id, name' })
    await testDb.open()
  })

  it('renders export and import buttons', () => {
    render(<PfExportImportView db={testDb} data-testid="backup-view" />, {
      wrapper: createWrapper(),
    })

    expect(screen.getByTestId('export-button')).toBeInTheDocument()
    expect(screen.getByTestId('import-button')).toBeInTheDocument()
  })

  it('shows "Never exported" when no lastExport', () => {
    render(<PfExportImportView db={testDb} />, {
      wrapper: createWrapper({ lastExport: null }),
    })

    expect(screen.getByText('Never exported')).toBeInTheDocument()
  })

  it('shows last export date when available', () => {
    render(<PfExportImportView db={testDb} />, {
      wrapper: createWrapper({ lastExport: '2025-01-15' }),
    })

    expect(screen.getByText('Last export: 2025-01-15')).toBeInTheDocument()
  })

  it('renders with data-testid prop', () => {
    render(<PfExportImportView db={testDb} data-testid="my-backup" />, {
      wrapper: createWrapper(),
    })

    expect(screen.getByTestId('my-backup')).toBeInTheDocument()
  })

  it('has hidden file input for import', () => {
    render(<PfExportImportView db={testDb} />, {
      wrapper: createWrapper(),
    })

    const fileInput = screen.getByTestId('import-file-input')
    expect(fileInput).toBeInTheDocument()
    expect(fileInput).toHaveAttribute('type', 'file')
    expect(fileInput).toHaveAttribute('accept', '.json')
  })
})
