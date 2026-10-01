mod calculations;
mod commands;
mod db;
mod error;
mod logging;
mod models;
mod repo;
mod state;

use state::AppState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let data_dir = app
                .path()
                .app_data_dir()
                .expect("não foi possível resolver a pasta de dados do aplicativo");
            std::fs::create_dir_all(&data_dir)?;

            logging::init(data_dir.join("logs"));

            let db_path = data_dir.join("gerenciador_lucros.db");
            let conn = db::open(&db_path)?;

            app.manage(AppState {
                conn: std::sync::Mutex::new(conn),
                db_path,
                data_dir,
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::sessions::session_create,
            commands::sessions::session_update,
            commands::sessions::session_delete,
            commands::sessions::session_get_detail,
            commands::sessions::session_list,
            commands::sessions::session_exists,
            commands::accounts::account_add,
            commands::accounts::account_update,
            commands::accounts::account_delete,
            commands::dashboard::dashboard_get,
            commands::settings::settings_get_all,
            commands::settings::settings_set,
            commands::backup::backup_create,
            commands::backup::backup_restore,
            commands::system::app_get_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
