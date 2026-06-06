import { useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { Settings } from '@plainfold/store'
import { BackupContext } from './backup-context'
import type { BackupConfig, ReminderRule } from './types.js'

const KEYS = {
  openCount: 'pf:backup:openCount',
  lastExport: 'pf:backup:lastExport',
  lastReminder: 'pf:backup:lastReminder',
}

interface PfBackupProviderProps extends BackupConfig {
  children: ReactNode
}

function evaluateRules(rules: ReminderRule[], openCount: number, lastExport: string | null): boolean {
  for (const rule of rules) {
    if (rule.type === 'open-count' && openCount >= rule.threshold && !lastExport) {
      return true
    }
    if (rule.type === 'days-since-export' && lastExport) {
      const daysSince = Math.floor((Date.now() - new Date(lastExport).getTime()) / 86400000)
      if (daysSince >= rule.threshold) return true
    }
  }
  return false
}

export function PfBackupProvider({ appName, reminderRules = [], children }: PfBackupProviderProps) {
  const [openCount, setOpenCount] = useState(0)
  const [lastExport, setLastExport] = useState<string | null>(null)
  const [lastReminder, setLastReminder] = useState<string | null>(null)
  const [shouldRemind, setShouldRemind] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function init() {
      const count = (await Settings.get<number>(KEYS.openCount)) ?? 0
      const newCount = count + 1
      await Settings.set(KEYS.openCount, newCount)
      setOpenCount(newCount)

      const exp = await Settings.get<string>(KEYS.lastExport)
      setLastExport(exp ?? null)

      const rem = await Settings.get<string>(KEYS.lastReminder)
      setLastReminder(rem ?? null)

      setShouldRemind(evaluateRules(reminderRules, newCount, exp ?? null))
      setReady(true)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const dismissReminder = useCallback(async () => {
    const now = new Date().toISOString()
    await Settings.set(KEYS.lastReminder, now)
    setLastReminder(now)
    setShouldRemind(false)
  }, [])

  if (!ready) return null

  return (
    <BackupContext.Provider value={{ appName, openCount, lastExport, lastReminder, shouldRemind, dismissReminder }}>
      {children}
    </BackupContext.Provider>
  )
}
