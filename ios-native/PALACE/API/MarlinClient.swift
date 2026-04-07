import Foundation
import AVFoundation

/// Marlin Voice API client — talks to sigserve via Cloudflare tunnel
actor MarlinClient {
    static let shared = MarlinClient()

    struct VoiceResponse: Decodable {
        let transcript: String
        let response: String
        let model: String
        let audio: String // base64 WAV
        let timings: Timings

        struct Timings: Decodable {
            let stt: Double
            let llm: Double
            let tts: Double
            let total: Double
        }
    }

    struct ChatResponse: Decodable {
        let response: String
        let model: String
    }

    func sendVoice(audioData: Data, sessionId: String, voice: String = "am_adam") async throws -> VoiceResponse {
        var req = URLRequest(url: PALACEEnvironment.marlinURL(path: "/api/voice"))
        req.httpMethod = "POST"

        let boundary = UUID().uuidString
        req.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        var body = Data()
        // Audio file
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"audio\"; filename=\"recording.wav\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: audio/wav\r\n\r\n".data(using: .utf8)!)
        body.append(audioData)
        body.append("\r\n".data(using: .utf8)!)
        // Session ID
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"session_id\"\r\n\r\n".data(using: .utf8)!)
        body.append("\(sessionId)\r\n".data(using: .utf8)!)
        // Voice
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"voice\"\r\n\r\n".data(using: .utf8)!)
        body.append("\(voice)\r\n".data(using: .utf8)!)
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)

        req.httpBody = body
        req.timeoutInterval = 60

        let (data, _) = try await URLSession.shared.data(for: req)
        return try JSONDecoder().decode(VoiceResponse.self, from: data)
    }

    func chat(message: String, sessionId: String) async throws -> ChatResponse {
        var req = URLRequest(url: PALACEEnvironment.marlinURL(path: "/api/chat"))
        req.httpMethod = "POST"

        let boundary = UUID().uuidString
        req.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        var body = Data()
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"message\"\r\n\r\n".data(using: .utf8)!)
        body.append("\(message)\r\n".data(using: .utf8)!)
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"session_id\"\r\n\r\n".data(using: .utf8)!)
        body.append("\(sessionId)\r\n".data(using: .utf8)!)
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)

        req.httpBody = body
        req.timeoutInterval = 60

        let (data, _) = try await URLSession.shared.data(for: req)
        return try JSONDecoder().decode(ChatResponse.self, from: data)
    }

    func playAudio(base64: String) async throws {
        guard let audioData = Data(base64Encoded: base64) else { return }
        let player = try AVAudioPlayer(data: audioData)
        player.play()
        // Wait for playback to finish
        try await Task.sleep(for: .seconds(player.duration + 0.1))
    }
}
