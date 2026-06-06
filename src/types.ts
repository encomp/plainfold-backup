export interface ReminderRule {
  type: 'open-count' | 'days-since-export'
  threshold: number
}

export interface BackupConfig {
  appName: string
  reminderRules?: ReminderRule[]
}

export interface BackupState {
  openCount: number
  lastExport: string | null
  lastReminder: string | null
  shouldRemind: boolean
}
