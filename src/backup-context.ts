import { createContext, useContext } from 'react'
import type { BackupState } from './types'

interface BackupContextValue extends BackupState {
  appName: string
  dismissReminder: () => void
}

export const BackupContext = createContext<BackupContextValue | null>(null)

export function useBackupContext() {
  const ctx = useContext(BackupContext)
  if (!ctx) throw new Error('useBackupContext must be used within PfBackupProvider')
  return ctx
}
