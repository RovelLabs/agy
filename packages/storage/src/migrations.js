/**
 * OPERON Database Schema Migrations
 */
export const migrations = [
  {
    version: 1,
    name: 'initial_schema',
    up(db) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS schema_version (
          version INTEGER PRIMARY KEY,
          applied_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS workflows (
          id TEXT PRIMARY KEY,
          version INTEGER NOT NULL DEFAULT 1,
          name TEXT NOT NULL,
          description TEXT,
          icon TEXT,
          category TEXT NOT NULL,
          platforms TEXT NOT NULL,
          permissions TEXT NOT NULL,
          trigger_def TEXT NOT NULL,
          conditions TEXT NOT NULL,
          steps TEXT NOT NULL,
          is_builtin INTEGER NOT NULL DEFAULT 0,
          enabled INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS execution_history (
          id TEXT PRIMARY KEY,
          workflow_id TEXT NOT NULL,
          status TEXT NOT NULL,
          duration_ms REAL NOT NULL,
          output TEXT,
          error TEXT,
          executed_at TEXT NOT NULL,
          FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_history_workflow ON execution_history(workflow_id);
        CREATE INDEX IF NOT EXISTS idx_history_date ON execution_history(executed_at DESC);
      `);
    }
  }
];
