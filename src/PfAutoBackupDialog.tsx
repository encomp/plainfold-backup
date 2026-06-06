import { useState } from 'react'
import { useBackupContext } from './backup-context'

interface PfAutoBackupDialogProps {
  onExport: () => void
  triggerAtCount?: number
}

export function PfAutoBackupDialog({ onExport, triggerAtCount = 5 }: PfAutoBackupDialogProps) {
  const { openCount, lastExport, dismissReminder } = useBackupContext()
  const [dismissed, setDismissed] = useState(false)

  const show = !dismissed && !lastExport && openCount >= triggerAtCount

  if (!show) return null

  return (
    <div
      data-testid="auto-backup-dialog"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={() => { setDismissed(true); dismissReminder() }}
        style={{ position: 'fixed', inset: 0, background: 'var(--pf-bg-overlay)', zIndex: 999 }}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 1001,
          background: 'var(--pf-bg-surface)',
          border: '1px solid var(--pf-border)',
          borderRadius: 'var(--pf-radius-lg)',
          padding: '24px',
          maxWidth: '400px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <h2 style={{ fontFamily: 'var(--pf-font-ui)', fontSize: '18px', fontWeight: 600, color: 'var(--pf-text-primary)', margin: 0 }}>
          Back up your data
        </h2>
        <p style={{ fontFamily: 'var(--pf-font-ui)', fontSize: '14px', color: 'var(--pf-text-secondary)', lineHeight: 1.6 }}>
          Your data is stored only in this browser. Export a backup to keep it safe.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            onClick={() => { setDismissed(true); dismissReminder() }}
            style={{
              background: 'transparent',
              border: '1px solid transparent',
              color: 'var(--pf-text-secondary)',
              fontFamily: 'var(--pf-font-ui)',
              fontSize: '14px',
              padding: '8px 16px',
              borderRadius: 'var(--pf-radius-md)',
              cursor: 'pointer',
            }}
          >
            Later
          </button>
          <button
            onClick={() => { onExport(); setDismissed(true) }}
            data-testid="auto-backup-export"
            style={{
              background: 'var(--pf-accent)',
              color: 'var(--pf-bg-base)',
              border: '1px solid transparent',
              fontFamily: 'var(--pf-font-ui)',
              fontSize: '14px',
              fontWeight: 500,
              padding: '8px 16px',
              borderRadius: 'var(--pf-radius-md)',
              cursor: 'pointer',
            }}
          >
            Export Now
          </button>
        </div>
      </div>
    </div>
  )
}
