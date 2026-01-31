use crate::db::Database;
use crate::error::Result;
use serde::{Deserialize, Serialize};
use sqlx::Row;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub theme: String,
    pub default_search_engine: String,
    pub ai_provider: String,
    pub ai_model: String,
    pub agent_mode_enabled: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            theme: "light".to_string(),
            default_search_engine: "google".to_string(),
            ai_provider: "openai".to_string(),
            ai_model: "gpt-4o".to_string(),
            agent_mode_enabled: false,
        }
    }
}

pub async fn get_settings(db: &Database) -> Result<Settings> {
    let rows = sqlx::query("SELECT key, value FROM settings")
        .fetch_all(db)
        .await?;

    let mut settings = Settings::default();

    for row in rows {
        let key: String = row.get("key");
        let value: String = row.get("value");

        match key.as_str() {
            "theme" => settings.theme = value,
            "default_search_engine" => settings.default_search_engine = value,
            "ai_provider" => settings.ai_provider = value,
            "ai_model" => settings.ai_model = value,
            "agent_mode_enabled" => {
                settings.agent_mode_enabled = value.parse().unwrap_or(false)
            }
            _ => {}
        }
    }

    Ok(settings)
}

pub async fn update_settings(db: &Database, settings: &Settings) -> Result<()> {
    let mut tx = db.begin().await?;

    sqlx::query("INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)")
        .bind("theme")
        .bind(&settings.theme)
        .execute(&mut *tx)
        .await?;

    sqlx::query("INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)")
        .bind("default_search_engine")
        .bind(&settings.default_search_engine)
        .execute(&mut *tx)
        .await?;

    sqlx::query("INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)")
        .bind("ai_provider")
        .bind(&settings.ai_provider)
        .execute(&mut *tx)
        .await?;

    sqlx::query("INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)")
        .bind("ai_model")
        .bind(&settings.ai_model)
        .execute(&mut *tx)
        .await?;

    sqlx::query("INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)")
        .bind("agent_mode_enabled")
        .bind(settings.agent_mode_enabled.to_string())
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;
    Ok(())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversationMessage {
    pub role: String,
    pub content: String,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Conversation {
    pub id: String,
    pub tab_id: Option<String>,
    pub model_provider: String,
    pub messages: Vec<ConversationMessage>,
}

pub async fn get_conversation(db: &Database, conversation_id: &str) -> Result<Option<Conversation>> {
    let row = sqlx::query(
        "SELECT id, tab_id, model_provider, messages FROM agent_conversations WHERE id = ?1",
    )
    .bind(conversation_id)
    .fetch_optional(db)
    .await?;

    if let Some(row) = row {
        let messages_json: String = row.get("messages");
        let messages: Vec<ConversationMessage> =
            serde_json::from_str(&messages_json).unwrap_or_default();

        Ok(Some(Conversation {
            id: row.get("id"),
            tab_id: row.get("tab_id"),
            model_provider: row.get("model_provider"),
            messages,
        }))
    } else {
        Ok(None)
    }
}

pub async fn save_conversation(db: &Database, conversation: &Conversation) -> Result<()> {
    let messages_json = serde_json::to_string(&conversation.messages)?;

    sqlx::query(
        r#"
        INSERT OR REPLACE INTO agent_conversations (id, tab_id, model_provider, messages, updated_at)
        VALUES (?1, ?2, ?3, ?4, CURRENT_TIMESTAMP)
        "#,
    )
    .bind(&conversation.id)
    .bind(&conversation.tab_id)
    .bind(&conversation.model_provider)
    .bind(messages_json)
    .execute(db)
    .await?;

    Ok(())
}

pub async fn create_conversation(
    db: &Database,
    tab_id: Option<String>,
    model_provider: String,
) -> Result<Conversation> {
    let conversation = Conversation {
        id: uuid::Uuid::new_v4().to_string(),
        tab_id,
        model_provider,
        messages: vec![],
    };

    save_conversation(db, &conversation).await?;
    Ok(conversation)
}

pub async fn add_message_to_conversation(
    db: &Database,
    conversation_id: &str,
    role: &str,
    content: &str,
) -> Result<()> {
    let mut conversation = get_conversation(db, conversation_id)
        .await?
        .ok_or_else(|| crate::error::BrowserError::NotFound(
            format!("Conversation {} not found", conversation_id)
        ))?;

    conversation.messages.push(ConversationMessage {
        role: role.to_string(),
        content: content.to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    });

    save_conversation(db, &conversation).await?;
    Ok(())
}

// History types and functions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryEntry {
    pub id: i64,
    pub url: String,
    pub title: Option<String>,
    pub visit_count: i32,
    pub last_visit: String,
}

pub async fn add_history_entry(
    db: &Database,
    url: &str,
    title: Option<&str>,
) -> Result<()> {
    // Check if URL already exists
    let existing = sqlx::query("SELECT id, visit_count FROM history WHERE url = ?1")
        .bind(url)
        .fetch_optional(db)
        .await?;

    if let Some(row) = existing {
        // Update existing entry
        let id: i64 = row.get("id");
        let count: i32 = row.get("visit_count");
        sqlx::query(
            "UPDATE history SET visit_count = ?1, last_visit = CURRENT_TIMESTAMP, title = COALESCE(?2, title) WHERE id = ?3"
        )
        .bind(count + 1)
        .bind(title)
        .bind(id)
        .execute(db)
        .await?;
    } else {
        // Insert new entry
        sqlx::query(
            "INSERT INTO history (url, title, visit_count, last_visit) VALUES (?1, ?2, 1, CURRENT_TIMESTAMP)"
        )
        .bind(url)
        .bind(title)
        .execute(db)
        .await?;
    }

    Ok(())
}

pub async fn get_history(db: &Database) -> Result<Vec<HistoryEntry>> {
    let rows = sqlx::query(
        "SELECT id, url, title, visit_count, last_visit FROM history ORDER BY last_visit DESC LIMIT 1000"
    )
    .fetch_all(db)
    .await?;

    let history = rows
        .into_iter()
        .map(|row| HistoryEntry {
            id: row.get("id"),
            url: row.get("url"),
            title: row.get("title"),
            visit_count: row.get("visit_count"),
            last_visit: row.get("last_visit"),
        })
        .collect();

    Ok(history)
}

pub async fn clear_history(db: &Database) -> Result<()> {
    sqlx::query("DELETE FROM history").execute(db).await?;
    Ok(())
}

// Bookmark types and functions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bookmark {
    pub id: i64,
    pub url: String,
    pub title: String,
    pub folder_id: Option<i64>,
    pub created_at: String,
}

pub async fn add_bookmark(
    db: &Database,
    url: &str,
    title: &str,
    folder_id: Option<i64>,
) -> Result<Bookmark> {
    let id = sqlx::query(
        "INSERT INTO bookmarks (url, title, folder_id) VALUES (?1, ?2, ?3)"
    )
    .bind(url)
    .bind(title)
    .bind(folder_id)
    .execute(db)
    .await?
    .last_insert_rowid();

    Ok(Bookmark {
        id,
        url: url.to_string(),
        title: title.to_string(),
        folder_id,
        created_at: chrono::Utc::now().to_rfc3339(),
    })
}

pub async fn get_bookmarks(db: &Database) -> Result<Vec<Bookmark>> {
    let rows = sqlx::query(
        "SELECT id, url, title, folder_id, created_at FROM bookmarks ORDER BY created_at DESC"
    )
    .fetch_all(db)
    .await?;

    let bookmarks = rows
        .into_iter()
        .map(|row| Bookmark {
            id: row.get("id"),
            url: row.get("url"),
            title: row.get("title"),
            folder_id: row.get("folder_id"),
            created_at: row.get("created_at"),
        })
        .collect();

    Ok(bookmarks)
}

pub async fn delete_bookmark(db: &Database, id: i64) -> Result<()> {
    sqlx::query("DELETE FROM bookmarks WHERE id = ?1")
        .bind(id)
        .execute(db)
        .await?;
    Ok(())
}
