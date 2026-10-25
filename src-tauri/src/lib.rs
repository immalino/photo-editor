use std::sync::Mutex;
use tauri::{Emitter, Manager};

struct PendingFiles(Mutex<Vec<String>>);

#[tauri::command]
fn get_initial_files(state: tauri::State<'_, PendingFiles>) -> Vec<String> {
  let mut lock = state.0.lock().unwrap();
  let files = lock.clone();
  lock.clear();
  files
}

#[tauri::command]
fn read_image_file_bytes(path: String) -> Result<Vec<u8>, String> {
  std::fs::read(&path).map_err(|e| format!("Failed to read {}: {}", path, e))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  // Capture CLI arguments passed at cold start (e.g. from Windows "Open with")
  let mut initial_args: Vec<String> = std::env::args().skip(1).collect();
  initial_args.retain(|arg| !arg.starts_with('-'));

  tauri::Builder::default()
    .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
      let mut files: Vec<String> = argv.into_iter().skip(1).collect();
      files.retain(|arg| !arg.starts_with('-'));

      if !files.is_empty() {
        let _ = app.emit("files-opened", files);
      }

      if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
      }
    }))
    .manage(PendingFiles(Mutex::new(initial_args)))
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .invoke_handler(tauri::generate_handler![
      get_initial_files,
      read_image_file_bytes
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
