#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod audio;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            audio::start_recording,
            audio::stop_recording,
            audio::recording_status,
            audio::list_recordings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running PALACE");
}
