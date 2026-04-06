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
                        // Map view placeholder
                        Text("Map coming soon")
                            .navigationTitle("Map")
                    } label: {
                        Label("Map", systemImage: "map.fill")
                    }

                    NavigationLink {
                        Text("Graph coming soon")
                            .navigationTitle("Graph")
                    } label: {
                        Label("Graph", systemImage: "point.3.connected.trianglepath.dotted")
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

                    NavigationLink {
                        Text("Conversation history coming soon")
                            .navigationTitle("History")
                    } label: {
                        Label("Chat History", systemImage: "clock.arrow.circlepath")
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
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("Insights")
        .task {
            stats = try? await APIClient.shared.getStats()
        }
    }
}

// MARK: - Voice Settings

struct VoiceSettingsView: View {
    var body: some View {
        List {
            Section("Local Models") {
                LabeledContent("Fast Model", value: "Gemma 4 E4B")
                LabeledContent("Reasoning Model", value: "Gemma 4 26B MoE")
                LabeledContent("STT", value: "Whisper V3 Turbo")
                LabeledContent("TTS", value: "Kokoro v1.0")
            }

            Section("Endpoints") {
                LabeledContent("Voice API", value: "marlin.sigflix.stream")
                LabeledContent("Data API", value: "api.wsig.me")
            }

            Section {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(.green)
                    Text("100% local inference — no cloud, no subscriptions")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("Voice & Model")
    }
}

// MARK: - About

struct AboutView: View {
    var body: some View {
        List {
            Section {
                VStack(spacing: 8) {
                    Image(systemName: "building.columns.fill")
                        .font(.system(size: 48))
                        .foregroundStyle(.orange)
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
