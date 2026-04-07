use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use hound::{WavSpec, WavWriter};
use std::sync::{Arc, Mutex};
use std::path::PathBuf;
use std::fs;

// Audio capture module for PALACE desktop app

#[derive(Clone, serde::Serialize)]
pub struct RecordingStatus {
    recording: bool,
    file_path: Option<String>,
    duration_seconds: f64,
}

// cpal::Stream is !Send+!Sync, but we only access from main thread via Tauri commands
struct StreamWrapper {
    _stream: cpal::Stream,
}
unsafe impl Send for StreamWrapper {}
unsafe impl Sync for StreamWrapper {}

struct RecordingState {
    stream: Option<StreamWrapper>,
    file_path: Option<String>,
    start_time: Option<std::time::Instant>,
}

static RECORDING: std::sync::OnceLock<Arc<Mutex<RecordingState>>> = std::sync::OnceLock::new();

fn get_state() -> &'static Arc<Mutex<RecordingState>> {
    RECORDING.get_or_init(|| {
        Arc::new(Mutex::new(RecordingState {
            stream: None,
            file_path: None,
            start_time: None,
        }))
    })
}

fn recordings_dir() -> PathBuf {
    let dir = dirs::home_dir()
        .unwrap_or_default()
        .join("PALACE")
        .join("recordings");
    fs::create_dir_all(&dir).ok();
    dir
}

#[tauri::command]
pub fn start_recording(source: String) -> Result<String, String> {
    let state = get_state();
    let mut state = state.lock().map_err(|e| e.to_string())?;

    if state.stream.is_some() {
        return Err("Already recording".into());
    }

    let host = cpal::default_host();
    let device = host.default_input_device()
        .ok_or("No audio input device found")?;
    let config = device.default_input_config().map_err(|e| e.to_string())?;

    let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
    let filename = format!("palace_{}_{}.wav", source, timestamp);
    let file_path = recordings_dir().join(&filename);
    let file_path_str = file_path.to_string_lossy().to_string();

    let spec = WavSpec {
        channels: config.channels(),
        sample_rate: config.sample_rate().0,
        bits_per_sample: 16,
        sample_format: hound::SampleFormat::Int,
    };

    let writer = Arc::new(Mutex::new(Some(
        WavWriter::create(&file_path, spec).map_err(|e| e.to_string())?,
    )));

    let writer_clone = writer.clone();
    let err_fn = |err: cpal::StreamError| {
        eprintln!("Audio stream error: {}", err);
    };

    let stream = match config.sample_format() {
        cpal::SampleFormat::F32 => {
            device.build_input_stream(
                &config.into(),
                move |data: &[f32], _: &cpal::InputCallbackInfo| {
                    if let Ok(mut guard) = writer_clone.lock() {
                        if let Some(ref mut w) = *guard {
                            for &sample in data {
                                let s = (sample * i16::MAX as f32) as i16;
                                w.write_sample(s).ok();
                            }
                        }
                    }
                },
                err_fn,
                None,
            )
        }
        cpal::SampleFormat::I16 => {
            device.build_input_stream(
                &config.into(),
                move |data: &[i16], _: &cpal::InputCallbackInfo| {
                    if let Ok(mut guard) = writer_clone.lock() {
                        if let Some(ref mut w) = *guard {
                            for &sample in data {
                                w.write_sample(sample).ok();
                            }
                        }
                    }
                },
                err_fn,
                None,
            )
        }
        _ => return Err("Unsupported sample format".into()),
    }
    .map_err(|e| e.to_string())?;

    stream.play().map_err(|e| e.to_string())?;

    state.stream = Some(StreamWrapper { _stream: stream });
    state.file_path = Some(file_path_str.clone());
    state.start_time = Some(std::time::Instant::now());

    Ok(file_path_str)
}

#[tauri::command]
pub fn stop_recording() -> Result<RecordingStatus, String> {
    let state = get_state();
    let mut state = state.lock().map_err(|e| e.to_string())?;

    let duration = state.start_time
        .map(|t| t.elapsed().as_secs_f64())
        .unwrap_or(0.0);
    let file_path = state.file_path.clone();

    state.stream = None;
    state.file_path = None;
    state.start_time = None;

    Ok(RecordingStatus {
        recording: false,
        file_path,
        duration_seconds: duration,
    })
}

#[tauri::command]
pub fn recording_status() -> Result<RecordingStatus, String> {
    let state = get_state();
    let state = state.lock().map_err(|e| e.to_string())?;

    Ok(RecordingStatus {
        recording: state.stream.is_some(),
        file_path: state.file_path.clone(),
        duration_seconds: state.start_time
            .map(|t| t.elapsed().as_secs_f64())
            .unwrap_or(0.0),
    })
}

#[tauri::command]
pub fn list_recordings() -> Result<Vec<String>, String> {
    let dir = recordings_dir();
    Ok(fs::read_dir(dir)
        .ok()
        .map(|entries| {
            entries
                .filter_map(|e| e.ok())
                .filter(|e| e.path().extension().is_some_and(|ext| ext == "wav"))
                .map(|e| e.path().to_string_lossy().to_string())
                .collect()
        })
        .unwrap_or_default())
}
