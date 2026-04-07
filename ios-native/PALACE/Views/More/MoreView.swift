import SwiftUI

struct MoreView: View {
    var body: some View {
        NavigationStack {
            List {
                Section("Data") {
                    NavigationLink {
                        MemoriesView()
                    } label: {
                        Label("Memories", systemImage: "brain.head.profile.fill")
                    }

                    NavigationLink {
                        LocationMapView()
                    } label: {
                        Label("Map", systemImage: "map.fill")
                    }

                    NavigationLink {
                        InsightsView()
                    } label: {
                        Label("Insights", systemImage: "chart.bar.fill")
                    }
                }

                Section("Marlin") {
                    NavigationLink {
                        VoiceSettingsView()
                    } label: {
                        Label("Voice & Model", systemImage: "waveform.circle.fill")
                    }
                }

                Section("System") {
                    NavigationLink {
                        AboutView()
                    } label: {
                        Label("About PALACE", systemImage: "building.columns.fill")
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("More")
        }
    }
}

// MARK: - Insights

struct InsightsView: View {
    @State private var stats: Stats?

    var body: some View {
        List {
            if let stats {
                Section("Overview") {
                    LabeledContent("Conversations", value: "\(stats.conversations)")
                    LabeledContent("Memories", value: "\(stats.memories)")
                    LabeledContent("People", value: "\(stats.people)")
                }
            } else {
                ProgressView()
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("Insights")
        .task { stats = try? await APIClient.shared.getStats() }
    }
}

// MARK: - Voice Settings

struct VoiceSettingsView: View {
    @State private var healthy = false
    @State private var checking = true

    var body: some View {
        List {
            Section("Local Models") {
                LabeledContent("Fast Model", value: "Gemma 4 E4B")
                LabeledContent("Reasoning", value: "Gemma 4 26B MoE")
                LabeledContent("STT", value: "Whisper V3 Turbo")
                LabeledContent("TTS", value: "Kokoro v1.0")
            }

            Section("Endpoints") {
                HStack {
                    Text("Voice API")
                    Spacer()
                    Text(PALACEEnvironment.marlinBaseURL.host ?? "marlin")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Circle()
                        .fill(checking ? .gray : (healthy ? .green : .red))
                        .frame(width: 8, height: 8)
                }

                HStack {
                    Text("Data API")
                    Spacer()
                    Text(PALACEEnvironment.apiBaseURL.host ?? "api")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Circle().fill(.green).frame(width: 8, height: 8)
                }
            }

            Section {
                HStack {
                    Image(systemName: "lock.shield.fill")
                        .foregroundStyle(.green)
                    Text("100% local inference — no cloud, no subscriptions")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("Voice & Model")
        .task {
            healthy = (try? await URLSession.shared.data(from: PALACEEnvironment.marlinHealthURL))
                .map { $0.1 as? HTTPURLResponse }
                .flatMap { $0?.statusCode == 200 ? true : nil } ?? false
            checking = false
        }
    }
}

// MARK: - About

struct AboutView: View {
    var body: some View {
        List {
            Section {
                VStack(spacing: 8) {
                    MarlinAvatarView(size: 64)
                    Text("PALACE")
                        .font(.title2)
                        .fontWeight(.bold)
                    Text("Personal AI Life Archive")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    Text("v1.0.0")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 20)
                .listRowBackground(Color.clear)
            }

            Section("Stack") {
                LabeledContent("Frontend", value: "SwiftUI")
                LabeledContent("Backend", value: "wsigomi (SQLite)")
                LabeledContent("AI", value: "Gemma 4 + Whisper + Kokoro")
                LabeledContent("Server", value: "sigserve (M2 Max)")
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("About")
    }
}
