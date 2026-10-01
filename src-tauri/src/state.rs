use rusqlite::Connection;
use std::path::PathBuf;
use std::sync::Mutex;

pub struct AppState {
    pub conn: Mutex<Connection>,
    pub db_path: PathBuf,
    pub data_dir: PathBuf,
}
