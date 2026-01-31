use crate::error::Result;
use sqlx::{sqlite::SqlitePoolOptions, Pool, Sqlite};
use std::path::PathBuf;
use tauri::AppHandle;

pub type Database = Pool<Sqlite>;

pub async fn init_database(app_handle: &AppHandle) -> Result<Database> {
    let app_dir = get_app_dir(app_handle)?;
    std::fs::create_dir_all(&app_dir).map_err(|e| {
        crate::error::BrowserError::Configuration(format!("Failed to create app dir: {}", e))
    })?;

    let db_path = app_dir.join("browser.db");
    let db_url = format!("sqlite:{}", db_path.to_string_lossy());

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await?;

    // Run migrations
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS tabs (
            id TEXT PRIMARY KEY,
            url TEXT NOT NULL DEFAULT '',
            title TEXT NOT NULL DEFAULT 'New Tab',
            favicon TEXT,
            position INTEGER NOT NULL DEFAULT 0,
            is_active BOOLEAN NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        "#,
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT NOT NULL,
            title TEXT,
            visit_count INTEGER DEFAULT 1,
            last_visit DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_history_url ON history(url);
        CREATE INDEX IF NOT EXISTS idx_history_last_visit ON history(last_visit);
        "#,
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS bookmarks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT NOT NULL,
            title TEXT NOT NULL,
            folder_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        "#,
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS agent_conversations (
            id TEXT PRIMARY KEY,
            tab_id TEXT,
            model_provider TEXT NOT NULL DEFAULT 'openai',
            messages TEXT NOT NULL DEFAULT '[]',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (tab_id) REFERENCES tabs(id) ON DELETE SET NULL
        );
        "#,
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        "#,
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        INSERT OR IGNORE INTO settings (key, value) VALUES
        ('theme', 'light'),
        ('default_search_engine', 'google'),
        ('ai_provider', 'openai'),
        ('ai_model', 'gpt-4o'),
        ('agent_mode_enabled', 'false');
        "#,
    )
    .execute(&pool)
    .await?;

    tracing::info!("Database initialized at {:?}", db_path);
    Ok(pool)
}

fn get_app_dir(app_handle: &AppHandle) -> Result<PathBuf> {
    let path = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| {
            crate::error::BrowserError::Configuration(
                format!("Failed to get app data directory: {}", e)
            )
        })?;
    Ok(path)
}

pub async fn get_db(app_handle: &AppHandle) -> Result<Database> {
    init_database(app_handle).await
}
