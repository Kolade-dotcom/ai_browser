use crate::error::{BrowserError, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::process::{Child, Command, Stdio};
use std::sync::Arc;
use tokio::sync::{Mutex, RwLock};
use tokio_tungstenite::{connect_async, tungstenite::Message};
use tracing::{debug, error, info, warn};

pub type TabId = String;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tab {
    pub id: TabId,
    pub url: String,
    pub title: String,
    pub favicon: Option<String>,
    pub position: i32,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NavigationRequest {
    pub url: String,
}

pub struct BrowserManager {
    chrome_process: Option<Child>,
    tabs: Arc<RwLock<HashMap<TabId, Tab>>>,
    active_tab: Arc<RwLock<Option<TabId>>>,
    cdp_port: u16,
}

impl BrowserManager {
    pub fn new() -> Self {
        Self {
            chrome_process: None,
            tabs: Arc::new(RwLock::new(HashMap::new())),
            active_tab: Arc::new(RwLock::new(None)),
            cdp_port: 9222,
        }
    }

    pub async fn launch_chrome(&mut self, app_handle: &tauri::AppHandle) -> Result<()> {
        if self.chrome_process.is_some() {
            info!("Chrome already running");
            return Ok(());
        }

        let user_data_dir = app_handle
            .path()
            .app_data_dir()
            .map_err(|e| BrowserError::Configuration(format!("Cannot find app data directory: {}", e)))?
            .join("chrome-profile");

        std::fs::create_dir_all(&user_data_dir).map_err(|e| {
            BrowserError::Configuration(format!("Failed to create chrome profile dir: {}", e))
        })?;

        let chrome_cmd = self.find_chrome()?;
        let port = self.cdp_port;

        info!("Launching Chrome from {:?} on port {}", chrome_cmd, port);

        let child = Command::new(chrome_cmd)
            .arg(format!("--remote-debugging-port={}", port))
            .arg("--no-first-run")
            .arg("--no-default-browser-check")
            .arg("--disable-default-apps")
            .arg("--disable-popup-blocking")
            .arg(format!("--user-data-dir={}", user_data_dir.to_string_lossy()))
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|e| BrowserError::Cdp(format!("Failed to launch Chrome: {}", e)))?;

        self.chrome_process = Some(child);

        // Wait for Chrome to start accepting CDP connections
        tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;

        info!("Chrome launched successfully");
        Ok(())
    }

    fn find_chrome(&self) -> Result<std::path::PathBuf> {
        #[cfg(target_os = "windows")]
        {
            let program_files = std::env::var("ProgramFiles")
                .or_else(|_| std::env::var("ProgramFiles(x86)"))
                .map_err(|_| BrowserError::Configuration("ProgramFiles not found".to_string()))?;

            let paths = vec![
                std::path::PathBuf::from(&program_files)
                    .join("Google")
                    .join("Chrome")
                    .join("Application")
                    .join("chrome.exe"),
                std::path::PathBuf::from(&program_files)
                    .join("Microsoft")
                    .join("Edge")
                    .join("Application")
                    .join("msedge.exe"),
            ];

            for path in paths {
                if path.exists() {
                    return Ok(path);
                }
            }
        }

        #[cfg(target_os = "macos")]
        {
            let paths = vec![
                std::path::PathBuf::from("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),
                std::path::PathBuf::from("/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"),
            ];

            for path in paths {
                if path.exists() {
                    return Ok(path);
                }
            }
        }

        #[cfg(target_os = "linux")]
        {
            let candidates = vec!["google-chrome", "chromium", "chromium-browser", "microsoft-edge"];
            for cmd in candidates {
                if let Ok(path) = which::which(cmd) {
                    return Ok(path);
                }
            }
        }

        Err(BrowserError::Configuration(
            "Could not find Chrome, Edge, or Chromium. Please install one of them.".to_string(),
        ))
    }

    pub async fn create_tab(&self, url: Option<String>) -> Result<Tab> {
        let tab_id = uuid::Uuid::new_v4().to_string();
        let url = url.unwrap_or_else(|| "about:blank".to_string());

        let tab = Tab {
            id: tab_id.clone(),
            url: url.clone(),
            title: "New Tab".to_string(),
            favicon: None,
            position: self.get_next_position().await,
            is_active: true,
        };

        // Deactivate current active tab
        if let Some(active_id) = self.active_tab.read().await.clone() {
            let mut tabs = self.tabs.write().await;
            if let Some(t) = tabs.get_mut(&active_id) {
                t.is_active = false;
            }
        }

        // Activate new tab
        let mut active = self.active_tab.write().await;
        *active = Some(tab_id.clone());

        // Store tab
        self.tabs.write().await.insert(tab_id.clone(), tab.clone());

        info!("Created tab {} with URL {}", tab_id, url);
        Ok(tab)
    }

    pub async fn close_tab(&self, tab_id: &str) -> Result<()> {
        let mut tabs = self.tabs.write().await;

        if tabs.remove(tab_id).is_none() {
            return Err(BrowserError::NotFound(format!("Tab {} not found", tab_id)));
        }

        // If we closed the active tab, activate another one
        let mut active = self.active_tab.write().await;
        if active.as_deref() == Some(tab_id) {
            *active = tabs.keys().next().cloned();
            if let Some(new_active) = active.as_ref() {
                if let Some(t) = tabs.get_mut(new_active) {
                    t.is_active = true;
                }
            }
        }

        info!("Closed tab {}", tab_id);
        Ok(())
    }

    pub async fn switch_tab(&self, tab_id: &str) -> Result<Tab> {
        let mut tabs = self.tabs.write().await;

        // Deactivate current
        if let Some(active_id) = self.active_tab.read().await.clone() {
            if let Some(t) = tabs.get_mut(&active_id) {
                t.is_active = false;
            }
        }

        // Activate new
        if let Some(t) = tabs.get_mut(tab_id) {
            t.is_active = true;
            let mut active = self.active_tab.write().await;
            *active = Some(tab_id.to_string());
            info!("Switched to tab {}", tab_id);
            Ok(t.clone())
        } else {
            Err(BrowserError::NotFound(format!("Tab {} not found", tab_id)))
        }
    }

    pub async fn navigate_tab(&self, tab_id: &str, url: &str) -> Result<Tab> {
        let mut tabs = self.tabs.write().await;

        if let Some(t) = tabs.get_mut(tab_id) {
            t.url = url.to_string();
            info!("Navigated tab {} to {}", tab_id, url);
            Ok(t.clone())
        } else {
            Err(BrowserError::NotFound(format!("Tab {} not found", tab_id)))
        }
    }

    pub async fn get_tabs(&self) -> Vec<Tab> {
        let tabs = self.tabs.read().await;
        let mut tab_list: Vec<Tab> = tabs.values().cloned().collect();
        tab_list.sort_by_key(|t| t.position);
        tab_list
    }

    pub async fn get_active_tab(&self) -> Option<Tab> {
        let active_id = self.active_tab.read().await.clone()?;
        self.tabs.read().await.get(&active_id).cloned()
    }

    async fn get_next_position(&self) -> i32 {
        let tabs = self.tabs.read().await;
        tabs.len() as i32
    }
}

impl Drop for BrowserManager {
    fn drop(&mut self) {
        if let Some(mut child) = self.chrome_process.take() {
            let _ = child.kill();
        }
    }
}

// Global browser manager instance
use once_cell::sync::Lazy;
use std::sync::Mutex as StdMutex;

static BROWSER_MANAGER: Lazy<StdMutex<Option<Arc<Mutex<BrowserManager>>>>> =
    Lazy::new(|| StdMutex::new(None));

pub fn init_browser_manager() -> Arc<Mutex<BrowserManager>> {
    let manager = Arc::new(Mutex::new(BrowserManager::new()));
    let mut global = BROWSER_MANAGER.lock().unwrap();
    *global = Some(manager.clone());
    manager
}

pub fn get_browser_manager() -> Option<Arc<Mutex<BrowserManager>>> {
    BROWSER_MANAGER.lock().unwrap().clone()
}
