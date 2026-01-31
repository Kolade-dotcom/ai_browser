use crate::browser::{get_browser_manager, Tab, TabId};
use crate::db::get_db;
use crate::error::BrowserError;
use crate::storage::{
    add_bookmark, add_history_entry, add_message_to_conversation, clear_history, create_conversation,
    delete_bookmark, get_bookmarks, get_conversation, get_history, get_settings, update_settings,
    Bookmark, Conversation, HistoryEntry, Settings,
};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State};
use tracing::{debug, error, info};

// Global state for browser manager
pub struct BrowserState;

#[derive(Serialize)]
pub struct GreetingResponse {
    pub message: String,
}

#[tauri::command]
pub fn greet(name: &str) -> GreetingResponse {
    GreetingResponse {
        message: format!("Welcome to Aether, {}. Browse lightly. Think deeply.", name),
    }
}

#[tauri::command]
pub async fn create_tab(url: Option<String>) -> Result<Tab, String> {
    debug!("Creating tab with URL: {:?}", url);

    if let Some(manager) = get_browser_manager() {
        let manager = manager.lock().await;
        manager
            .create_tab(url)
            .await
            .map_err(|e| e.to_string())
    } else {
        Err("Browser manager not initialized".to_string())
    }
}

#[tauri::command]
pub async fn close_tab(tab_id: TabId) -> Result<(), String> {
    debug!("Closing tab: {}", tab_id);

    if let Some(manager) = get_browser_manager() {
        let manager = manager.lock().await;
        manager.close_tab(&tab_id).await.map_err(|e| e.to_string())
    } else {
        Err("Browser manager not initialized".to_string())
    }
}

#[tauri::command]
pub async fn switch_tab(tab_id: TabId) -> Result<Tab, String> {
    debug!("Switching to tab: {}", tab_id);

    if let Some(manager) = get_browser_manager() {
        let manager = manager.lock().await;
        manager
            .switch_tab(&tab_id)
            .await
            .map_err(|e| e.to_string())
    } else {
        Err("Browser manager not initialized".to_string())
    }
}

#[tauri::command]
pub async fn navigate_tab(tab_id: TabId, url: String) -> Result<Tab, String> {
    debug!("Navigating tab {} to URL: {}", tab_id, url);

    if let Some(manager) = get_browser_manager() {
        let manager = manager.lock().await;
        manager
            .navigate_tab(&tab_id, &url)
            .await
            .map_err(|e| e.to_string())
    } else {
        Err("Browser manager not initialized".to_string())
    }
}

#[tauri::command]
pub async fn get_tabs() -> Result<Vec<Tab>, String> {
    if let Some(manager) = get_browser_manager() {
        let manager = manager.lock().await;
        Ok(manager.get_tabs().await)
    } else {
        Err("Browser manager not initialized".to_string())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentMessageRequest {
    pub conversation_id: Option<String>,
    pub tab_id: Option<String>,
    pub message: String,
    pub provider: String,
    pub model: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentMessageResponse {
    pub conversation_id: String,
    pub response: String,
}

#[tauri::command]
pub async fn send_agent_message(
    app_handle: AppHandle,
    request: AgentMessageRequest,
) -> Result<AgentMessageResponse, String> {
    info!(
        "Sending agent message with provider: {}",
        request.provider
    );

    let db = get_db(&app_handle)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

    // Get or create conversation
    let conversation_id = if let Some(id) = &request.conversation_id {
        id.clone()
    } else {
        let conv = create_conversation(&db, request.tab_id.clone(), request.provider.clone())
            .await
            .map_err(|e| e.to_string())?;
        conv.id
    };

    // Add user message to conversation
    add_message_to_conversation(&db, &conversation_id, "user", &request.message)
        .await
        .map_err(|e| e.to_string())?;

    // TODO: Implement actual AI provider integration
    // For now, return a mock response
    let mock_response = format!(
        "I received your message: '{}' (Provider: {}, Model: {}). \
         Full AI integration coming soon!",
        request.message, request.provider, request.model
    );

    // Add assistant response to conversation
    add_message_to_conversation(&db, &conversation_id, "assistant", &mock_response)
        .await
        .map_err(|e| e.to_string())?;

    Ok(AgentMessageResponse {
        conversation_id,
        response: mock_response,
    })
}

#[tauri::command]
pub async fn get_conversation(
    app_handle: AppHandle,
    conversation_id: String,
) -> Result<Option<Conversation>, String> {
    let db = get_db(&app_handle)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

    crate::storage::get_conversation(&db, &conversation_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_settings(
    app_handle: AppHandle,
    settings: Settings,
) -> Result<(), String> {
    let db = get_db(&app_handle)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

    crate::storage::update_settings(&db, &settings)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_settings(app_handle: AppHandle) -> Result<Settings, String> {
    let db = get_db(&app_handle)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

    crate::storage::get_settings(&db)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn record_history(
    app_handle: AppHandle,
    url: String,
    title: Option<String>,
) -> Result<(), String> {
    let db = get_db(&app_handle)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

    add_history_entry(&db, &url, title.as_deref())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_history(app_handle: AppHandle) -> Result<Vec<HistoryEntry>, String> {
    let db = get_db(&app_handle)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

    crate::storage::get_history(&db)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn clear_history(app_handle: AppHandle) -> Result<(), String> {
    let db = get_db(&app_handle)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

    crate::storage::clear_history(&db)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_bookmark(
    app_handle: AppHandle,
    url: String,
    title: String,
    folder_id: Option<i64>,
) -> Result<Bookmark, String> {
    let db = get_db(&app_handle)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

    crate::storage::add_bookmark(&db, &url, &title, folder_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_bookmarks(app_handle: AppHandle) -> Result<Vec<Bookmark>, String> {
    let db = get_db(&app_handle)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

    crate::storage::get_bookmarks(&db)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_bookmark(
    app_handle: AppHandle,
    id: i64,
) -> Result<(), String> {
    let db = get_db(&app_handle)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

    crate::storage::delete_bookmark(&db, id)
        .await
        .map_err(|e| e.to_string())
}
