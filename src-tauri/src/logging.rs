use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;
use std::sync::OnceLock;

static LOG_PATH: OnceLock<PathBuf> = OnceLock::new();

pub fn init(log_dir: PathBuf) {
    let _ = std::fs::create_dir_all(&log_dir);
    let _ = LOG_PATH.set(log_dir.join("app.log"));
}

pub fn log_error(message: &str, detail: &str) {
    let Some(path) = LOG_PATH.get() else { return };
    let timestamp = chrono::Local::now().format("%Y-%m-%d %H:%M:%S");
    if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(path) {
        let _ = writeln!(file, "[{timestamp}] {message} | {detail}");
    }
}
