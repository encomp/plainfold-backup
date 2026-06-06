import { useEffect, useState } from 'react'
import { useBackupContext } from './backup-context'

export function PfBackupSnackbar() {
  const { shouldRemind, dismissReminder, lastExport } = useBackupContext()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (shouldRemind) setVisible(true)
  }, [shouldRemind])

  if (!visible) return null

  const message = lastExport
    ? 'Time to back up your data.'
    : "You haven't backed up yet — your data is only stored in this browser."

  return (
    <div
      data-testid="backup-snackbar"
      style={{
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--pf-bg-elevated)',
        border: '1px solid var(--pf-border)',
        borderRadius: 'var(--pf-radius-md)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 1000,
        fontFamily: 'var(--pf-font-ui)',
        fontSize: '14px',
        color: 'var(--pf-text-primary)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      <span>{message}</span>
      <button
        onClick={() => { setVisible(false); dismissReminder() }}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--pf-accent)',
          fontFamily: 'var(--pf-font-ui)',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          padding: '4px 8px',
          whiteSpace: 'nowrap',
        }}
      >
        Dismiss
      </button>
    </div>
  )
}
