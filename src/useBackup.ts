import { useCallback } from 'react'
import type Dexie from 'dexie'
import { Settings } from '@plainfold/store'
import { useBackupContext } from './backup-context'

const LAST_EXPORT_KEY = 'pf:backup:lastExport'

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

export function useBackup(db: Dexie) {
  const { appName, lastExport } = useBackupContext()

  const exportBackup = useCallback(async () => {
    try {
      const tables: Record<string, unknown[]> = {}
      for (const table of db.tables) {
        tables[table.name] = await table.toArray()
      }
      const data = JSON.stringify({ appName, exportedAt: new Date().toISOString(), tables }, null, 2)
      const blob = new Blob([data], { type: 'application/json' })

      const today = new Date().toISOString().split('T')[0]
      const filename = `${appName}-backup-${today}.json`

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)

      await Settings.set(LAST_EXPORT_KEY, today)
      return { success: true as const, filename }
    } catch (e) {
      return { success: false as const, error: e instanceof Error ? e.message : 'Unknown error' }
    }
  }, [db, appName])

  const importBackup = useCallback(async (file: File) => {
    try {
      const text = await readFileAsText(file)
      const json = JSON.parse(text)

      if (!json.tables || typeof json.tables !== 'object') {
        return { success: false as const, error: 'Invalid backup format' }
      }

      await db.transaction('rw', db.tables, async () => {
        for (const table of db.tables) {
          await table.clear()
          const rows = json.tables[table.name]
          if (Array.isArray(rows) && rows.length > 0) {
            await table.bulkAdd(rows)
          }
        }
      })

      return { success: true as const }
    } catch (e) {
      return { success: false as const, error: e instanceof Error ? e.message : 'Unknown error' }
    }
  }, [db])

  return { exportBackup, importBackup, lastExportDate: lastExport }
}
