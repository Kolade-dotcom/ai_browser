// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod browser;
mod commands;
mod db;
mod error;
mod storage;

use browser::init_browser_manager;
use tauri::Manager;
use tracing::info;

fn main() {
    tracing_subscriber::fmt()
        .with_target(false)
        .with_thread_ids(false)
        .with_level(true)
        .init();

    // Initialize browser manager
    init_browser_manager();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .setup(|app| {
            info!("Aether starting up...");

            // Initialize database
            let app_handle = app.handle();
            tauri::async_runtime::block_on(async {
                if let Err(e) = db::init_database(&app_handle).await {
                    tracing::error!("Failed to initialize database: {}", e);
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::greet,
            commands::create_tab,
            commands::close_tab,
            commands::switch_tab,
            commands::navigate_tab,
            commands::get_tabs,
            commands::send_agent_message,
            commands::get_conversation,
            commands::update_settings,
            commands::get_settings,
            commands::record_history,
            commands::get_history,
            commands::clear_history,
            commands::add_bookmark,
            commands::get_bookmarks,
            commands::delete_bookmark,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
