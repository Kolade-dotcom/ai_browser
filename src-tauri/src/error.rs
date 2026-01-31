use std::fmt;

#[derive(Debug)]
pub enum BrowserError {
    Database(String),
    Cdp(String),
    Network(String),
    Configuration(String),
    NotFound(String),
}

impl fmt::Display for BrowserError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            BrowserError::Database(msg) => write!(f, "Database error: {}", msg),
            BrowserError::Cdp(msg) => write!(f, "CDP error: {}", msg),
            BrowserError::Network(msg) => write!(f, "Network error: {}", msg),
            BrowserError::Configuration(msg) => write!(f, "Configuration error: {}", msg),
            BrowserError::NotFound(msg) => write!(f, "Not found: {}", msg),
        }
    }
}

impl std::error::Error for BrowserError {}

impl From<sqlx::Error> for BrowserError {
    fn from(err: sqlx::Error) -> Self {
        BrowserError::Database(err.to_string())
    }
}

impl From<serde_json::Error> for BrowserError {
    fn from(err: serde_json::Error) -> Self {
        BrowserError::Configuration(err.to_string())
    }
}

pub type Result<T> = std::result::Result<T, BrowserError>;
