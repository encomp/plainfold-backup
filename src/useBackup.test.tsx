import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import Dexie from 'dexie'
import { useBackup } from './useBackup'
import { BackupContext } from './backup-context'

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

// Mock URL.createObjectURL / revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

let testDb: Dexie

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

describe('useBackup', () => {
  beforeEach(async () => {
    for (const key of Object.keys(mockStore)) {
      delete mockStore[key]
    }

    // Create a fresh test db with fake-indexeddb
    testDb = new Dexie('test-backup-db')
    testDb.version(1).stores({
      items: '++id, name',
      tags: '++id, label',
    })
    await testDb.open()
    await testDb.table('items').clear()
    await testDb.table('tags').clear()
  })

  it('returns exportBackup, importBackup, and lastExportDate', () => {
    const { result } = renderHook(() => useBackup(testDb), {
      wrapper: createWrapper(),
    })

    expect(result.current.exportBackup).toBeTypeOf('function')
    expect(result.current.importBackup).toBeTypeOf('function')
    expect(result.current.lastExportDate).toBeNull()
  })

  it('returns lastExportDate from context', () => {
    const { result } = renderHook(() => useBackup(testDb), {
      wrapper: createWrapper({ lastExport: '2025-01-15' }),
    })

    expect(result.current.lastExportDate).toBe('2025-01-15')
  })

  it('exportBackup serializes db tables to JSON', async () => {
    await testDb.table('items').add({ name: 'Widget' })
    await testDb.table('tags').add({ label: 'important' })

    // Mock the anchor click
    const clickSpy = vi.fn()
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        return { href: '', download: '', click: clickSpy } as unknown as HTMLAnchorElement
      }
      return originalCreateElement(tag)
    })

    const { result } = renderHook(() => useBackup(testDb), {
      wrapper: createWrapper(),
    })

    const exportResult = await result.current.exportBackup()
    expect(exportResult.success).toBe(true)
    if (exportResult.success) {
      expect(exportResult.filename).toMatch(/^test-app-backup-\d{4}-\d{2}-\d{2}\.json$/)
    }
    expect(clickSpy).toHaveBeenCalled()

    vi.restoreAllMocks()
  })

  it('importBackup restores data into db tables', async () => {
    const backupData = {
      appName: 'test-app',
      exportedAt: '2025-01-01T00:00:00.000Z',
      tables: {
        items: [{ id: 1, name: 'Restored Widget' }],
        tags: [{ id: 1, label: 'restored' }],
      },
    }

    const content = JSON.stringify(backupData)
    const blob = new Blob([content], { type: 'application/json' })
    const file = new File([blob], 'backup.json', {
      type: 'application/json',
    })

    const { result } = renderHook(() => useBackup(testDb), {
      wrapper: createWrapper(),
    })

    const importResult = await result.current.importBackup(file)
    expect(importResult.success).toBe(true)

    const items = await testDb.table('items').toArray()
    expect(items).toHaveLength(1)
    expect(items[0].name).toBe('Restored Widget')

    const tags = await testDb.table('tags').toArray()
    expect(tags).toHaveLength(1)
    expect(tags[0].label).toBe('restored')
  })

  it('importBackup rejects invalid format', async () => {
    const content = JSON.stringify({ noTables: true })
    const blob = new Blob([content], { type: 'application/json' })
    const file = new File([blob], 'bad.json', {
      type: 'application/json',
    })

    const { result } = renderHook(() => useBackup(testDb), {
      wrapper: createWrapper(),
    })

    const importResult = await result.current.importBackup(file)
    expect(importResult.success).toBe(false)
    if (!importResult.success) {
      expect(importResult.error).toBe('Invalid backup format')
    }
  })
})
