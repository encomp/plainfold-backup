import { useState, useRef } from 'react'
import type Dexie from 'dexie'
import { useBackup } from './useBackup'

interface PfExportImportViewProps {
  db: Dexie
  'data-testid'?: string
}

export function PfExportImportView({ db, 'data-testid': testId }: PfExportImportViewProps) {
  const { exportBackup, importBackup, lastExportDate } = useBackup(db)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    setExporting(true)
    const result = await exportBackup()
    setMessage(result.success
      ? { text: `Exported ${result.filename}`, type: 'success' }
      : { text: result.error ?? 'Export failed', type: 'error' })
    setExporting(false)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    const result = await importBackup(file)
    setMessage(result.success
      ? { text: 'Restore complete. Reload to see changes.', type: 'success' }
      : { text: result.error ?? 'Restore failed', type: 'error' })
    setImporting(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const cardStyle: React.CSSProperties = {
    background: 'var(--pf-bg-surface)',
    border: '1px solid var(--pf-border)',
    borderRadius: 'var(--pf-radius-md)',
    padding: '20px',
  }

  const btnBase: React.CSSProperties = {
    fontFamily: 'var(--pf-font-ui)',
    fontSize: '14px',
    fontWeight: 500,
    padding: '8px 16px',
    borderRadius: 'var(--pf-radius-md)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  }

  return (
    <div data-testid={testId} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Export */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontFamily: 'var(--pf-font-ui)', fontSize: '16px', fontWeight: 600, color: 'var(--pf-text-primary)' }}>
            Export Backup
          </span>
          <p style={{ fontFamily: 'var(--pf-font-ui)', fontSize: '14px', color: 'var(--pf-text-secondary)' }}>
            Download a JSON backup of all your data.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--pf-text-muted)', fontFamily: 'var(--pf-font-ui)' }}>
              {lastExportDate ? `Last export: ${lastExportDate}` : 'Never exported'}
            </span>
            <button
              onClick={handleExport}
              disabled={exporting}
              data-testid="export-button"
              style={{ ...btnBase, background: 'var(--pf-accent)', color: 'var(--pf-bg-base)', border: '1px solid transparent', opacity: exporting ? 0.5 : 1 }}
            >
              {exporting ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>
      </div>

      {/* Import */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontFamily: 'var(--pf-font-ui)', fontSize: '16px', fontWeight: 600, color: 'var(--pf-text-primary)' }}>
            Restore from Backup
          </span>
          <p style={{ fontFamily: 'var(--pf-font-ui)', fontSize: '14px', color: 'var(--pf-text-secondary)' }}>
            Import a previously exported backup file. This will replace all current data.
          </p>
          <div>
            <input ref={fileRef} type="file" accept=".json" onChange={handleFileChange} style={{ display: 'none' }} id="pf-import-file" data-testid="import-file-input" />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              data-testid="import-button"
              style={{ ...btnBase, background: 'var(--pf-bg-surface-alt)', color: 'var(--pf-text-primary)', border: '1px solid var(--pf-border)', opacity: importing ? 0.5 : 1 }}
            >
              {importing ? 'Restoring...' : 'Choose File'}
            </button>
          </div>
        </div>
      </div>

      {/* Status message */}
      {message && (
        <div
          data-testid="backup-message"
          style={{
            fontFamily: 'var(--pf-font-ui)',
            fontSize: '14px',
            padding: '10px 14px',
            borderRadius: 'var(--pf-radius-sm)',
            background: message.type === 'success' ? 'var(--pf-positive-muted)' : 'var(--pf-danger-muted)',
            color: message.type === 'success' ? 'var(--pf-positive)' : 'var(--pf-danger)',
          }}
        >
          {message.text}
        </div>
      )}
    </div>
  )
}
