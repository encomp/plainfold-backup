## @plainfold/backup

Backup and restore provider for Plainfold apps. Provides React context, hooks, and UI components for exporting/importing Dexie database backups.

### Architecture

- **PfBackupProvider** — React context provider that tracks open count, last export, and reminder state using `@plainfold/store`
- **useBackup(db)** — Hook returning `exportBackup`, `importBackup`, and `lastExportDate`; takes a Dexie instance
- **PfBackupSnackbar** — Fixed-position notification bar shown when backup reminder triggers
- **PfAutoBackupDialog** — Modal dialog suggesting backup after N app opens
- **PfExportImportView** — Settings section with export button and import file picker

### Key Design Decisions

- No dependency on `@plainfold/ui` to avoid circular deps; all UI uses plain HTML with `--pf-*` CSS custom properties
- `dexie` and `react` are peer dependencies
- Store keys: `pf:backup:openCount`, `pf:backup:lastExport`, `pf:backup:lastReminder`
- Backup format is JSON with `{ appName, exportedAt, tables: { [tableName]: rows[] } }`

### Commands

```bash
npm test          # Run tests (vitest)
npm run lint      # ESLint
npm run typecheck # TypeScript check
npm run build     # Vite library build (dist/index.mjs + dist/index.cjs)
```

### Testing

Tests use vitest + @testing-library/react + jsdom + fake-indexeddb. The `@plainfold/store` module is mocked in tests via `vi.mock`. Components are tested by wrapping them in `BackupContext.Provider` with controlled values.
