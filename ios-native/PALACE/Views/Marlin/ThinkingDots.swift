import SwiftUI

/// Animated thinking dots — continuous bouncing wave like iMessage typing indicator
struct ThinkingDots: View {
    @State private var animating = false

    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<3, id: \.self) { i in
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [.orange.opacity(0.7), .pink.opacity(0.5)],
                            startPoint: .top, endPoint: .bottom
                        )
                    )
                    .frame(width: 8, height: 8)
                    .offset(y: animating ? -6 : 0)
                    .animation(
                        .easeInOut(duration: 0.45)
                            .repeatForever(autoreverses: true)
                            .delay(Double(i) * 0.12),
                        value: animating
                    )
            }
        }
        .onAppear { animating = true }
        .onDisappear { animating = false }
    }
}

/// Pulsing ring animation around Marlin's avatar during processing
struct PulsingRing: View {
    @State private var pulsing = false

    let size: CGFloat
    let color: Color

    init(size: CGFloat = 32, color: Color = .orange) {
        self.size = size
        self.color = color
    }

    var body: some View {
        ZStack {
            Circle()
                .stroke(color.opacity(0.3), lineWidth: 2)
                .frame(width: size, height: size)
                .scaleEffect(pulsing ? 1.5 : 1.0)
                .opacity(pulsing ? 0 : 0.6)

            Circle()
                .stroke(color.opacity(0.2), lineWidth: 1.5)
                .frame(width: size, height: size)
                .scaleEffect(pulsing ? 1.8 : 1.0)
                .opacity(pulsing ? 0 : 0.4)
        }
        .animation(.easeOut(duration: 1.2).repeatForever(autoreverses: false), value: pulsing)
        .onAppear { pulsing = true }
    }
}

/// Waveform bars for recording state
struct RecordingWaveform: View {
    @State private var animating = false

    var body: some View {
        HStack(spacing: 3) {
            ForEach(0..<5, id: \.self) { i in
                RoundedRectangle(cornerRadius: 2)
                    .fill(Color.red.opacity(0.7))
                    .frame(width: 3, height: animating ? CGFloat.random(in: 8...24) : 6)
                    .animation(
                        .easeInOut(duration: 0.3 + Double(i) * 0.05)
                            .repeatForever(autoreverses: true)
                            .delay(Double(i) * 0.08),
                        value: animating
                    )
            }
        }
        .onAppear { animating = true }
        .onDisappear { animating = false }
    }
}
