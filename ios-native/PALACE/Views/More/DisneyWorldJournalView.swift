import SwiftUI

// MARK: - Journal Day Model
struct JournalDay: Identifiable {
    let id = UUID()
    let dayNumber: String
    let date: String
    let title: String
    let content: String
    let imageName: String?
    let imageCaption: String?
    let mishapTitle: String?
    let mishapContent: String?
    let funMomentTitle: String?
    let funMomentContent: String?
}

struct DisneyWorldJournalView: View {
    @State private var isPlaying = true
    @State private var rotationAngle = 0.0
    
    // Theme Colors matching the HTML Warm Noir Palette
    private let darkBg = Color(red: 0.06, green: 0.05, blue: 0.05) // #0F0E0E
    private let cardBg = Color(red: 0.10, green: 0.09, blue: 0.09).opacity(0.65)
    private let accentOrange = Color(red: 1.0, green: 0.42, blue: 0.21) // #FF6B35
    private let accentPink = Color(red: 0.97, green: 0.15, blue: 0.52) // #F72585
    private let textPrimary = Color(red: 0.95, green: 0.95, blue: 0.95)
    private let textSecondary = Color(red: 0.71, green: 0.69, blue: 0.68) // #B5B0AE
    
    private let days = [
        JournalDay(
            dayNumber: "DAY 1",
            date: "Monday • May 18",
            title: "The Boardwalk & Room Tour",
            content: "The journey started at baggage claim 3 in Orlando International Airport, coordinating the pickup and scooter logistics. We checked into our accessible suite base at Disney’s All Star Music Resort.\n\nBefore unpacking, we took a sunset roll from Hollywood Studios to the Boardwalk. Tectonic wood decks, evening breezes, and watching the neon skyline light up served as our induction into park life.",
            imageName: nil,
            imageCaption: nil,
            mishapTitle: "Logistics Mishap",
            mishapContent: "Unpacking the accessible suite felt like setting up a mobile command center. Chargers, battery banks, Instacart deliveries, and scooter cables took up every outlet. In the middle of it, we were sorting out dermatology and blood work dates for the following week, alongside coordinating a remote app release—the work never completely sleeps.",
            funMomentTitle: nil,
            funMomentContent: nil
        ),
        JournalDay(
            dayNumber: "DAY 2",
            date: "Tuesday • May 19",
            title: "Magic Kingdom — Speed & Sugar",
            content: "Main Street at park open is a dense grid of warm sugar, heavy humidity, and high ambient decibels. Rolling through the crowd, we checked off our targets with mechanical precision:\n\n• Peter Pan's Flight — Flying over London in the dark, classic storytelling.\n• Pirates of the Caribbean — Sailing caverns of bromine and old wood.\n• Carousel of Progress — A cool 20 minutes in the rotating theater listening to Walt’s classic sermon.\n• TRON Lightcycle / Run — Launching under the massive grid of blue neon.\n• TTA PeopleMover — Cruising the rafters of Space Mountain in the afternoon breeze.\n\nWe fueled the run with two Magic Kingdom staples: corn dog nuggets and a warm Cheshire Cattail.",
            imageName: "disney_cinderella_castle_noir",
            imageCaption: "Cinderella Castle under the glowing magenta fireworks.",
            mishapTitle: "🌭 Funny Mishap: The 4:20 PM Scramble",
            mishapContent: "At 4:20 PM, a minor panic set in. We needed to catch the Disney bus by 4:30. Running on 'vacation time,' I tried to joke about routines and schedule independence. My partner pushes back: the bus schedule waits for no one. In the middle of our frantic, high-speed scooter sprint, my shorts got covered in mystery syrup, forcing a chaotic, emergency wet-wipe clean-up on the move.",
            funMomentTitle: "🛶 Funny Moment: Jungle Cruise Skipper",
            funMomentContent: "During our boarding of the Jungle Cruise, our skipper delivered a barrage of rapid-fire dad jokes. We passed a family of deer: 'There are the deer... Oh look, they're starting a family... Dear, dear, dear!' We also reacted to an injured rabbit near Big Thunder which Josie gently saved from the crowd."
        ),
        JournalDay(
            dayNumber: "DAY 3",
            date: "Wednesday • May 20",
            title: "The Silent Off-Day",
            content: "A quiet mid-week break. No wearable audio logs, no timelines, no structured plans. Just pool water, accessible room comfort, and a complete recharge of both human and mechanical batteries. Rest is part of the engineering.",
            imageName: nil,
            imageCaption: nil,
            mishapTitle: nil,
            mishapContent: nil,
            funMomentTitle: nil,
            funMomentContent: nil
        ),
        JournalDay(
            dayNumber: "DAY 4",
            date: "Thursday • May 21",
            title: "EPCOT — The Cosmic Rewind",
            content: "EPCOT always feels like an optimistic editorial on human potential. Our primary target: Guardians of the Galaxy: Cosmic Rewind.\n\nIn the weeks leading up to this, back at the house during Mother's Day dinner, I admitted I was genuinely nervous—if not flat-out scared—about this ride. The reverse launch and the free-spinning coaches are a serious physical challenge. But stepping into the Wonders of Xandar pavilion and boarding the Starjumper, the apprehension vanished.\n\nThe teleportation pre-show went sideways when the cosmic generator was reported 'stolen,' and then came the launch: a blur of kinetic acceleration, spinning backward through the cosmos under the neon-pink gaze of a giant celestial while classic pop echoed in our ears. I handled the forces perfectly. It was an absolute triumph.\n\nAfterward, we hit Mission: SPACE (Orange Mission), pulling high G-forces in the centrifuge, before taking a relaxing walk through the interactive Moana Journey of Water and Remy's trackless sprint through the kitchen.",
            imageName: "disney_epcot_sphere_noir",
            imageCaption: "Spaceship Earth geosphere illuminated with geometric precision.",
            mishapTitle: "🌀 Mishap: Mission Space vs. Guardians",
            mishapContent: "After walking off Cosmic Rewind feeling like a champ, we decided to tackle the 'Orange Mission' (Centrifuge training) at Mission: SPACE. We got in line feeling overconfident. As the G-forces hit during launch, we realized just how different continuous centrifuge speed is compared to roller-coaster adrenaline. We made it through safely, but it was a sobering reminder of centrifuge gravity!",
            funMomentTitle: nil,
            funMomentContent: nil
        ),
        JournalDay(
            dayNumber: "DAY 5",
            date: "Friday • May 22",
            title: "The Retrospective Flight",
            content: "We checked out of All Star Music, packed the checked bag, loaded the scooter, and took a rideshare to MCO. Boarding our 1:05 PM Breeze Airways flight back to RDU, we settled in.\n\nAs the plane climbed over the Florida coastline, we did a retrospective on our absolute favorite rides of the entire trip. The verdict was unanimous:\n\n1. Guardians of the Galaxy: Cosmic Rewind (The nerves were real, but the payoff was legendary)\n2. TRON Lightcycle / Run (Pure, uncluttered kinetic speed)\n3. Star Tours (A timeless, simulator-based classic)\n\nWe touched down in Raleigh-Durham in the late afternoon. Trip complete. Synced and recorded.",
            imageName: "disney_galaxy_edge_noir",
            imageCaption: "The Millennium Falcon resting in the docking bay of Galaxy's Edge.",
            mishapTitle: nil,
            mishapContent: nil,
            funMomentTitle: nil,
            funMomentContent: nil
        )
    ]
    
    var body: some View {
        ScrollView {
            VStack(spacing: 32) {
                // MARK: - Header Section
                VStack(spacing: 8) {
                    HStack(spacing: 12) {
                        Text("Omi Active")
                            .font(.caption2.weight(.bold))
                            .textCase(.uppercase)
                            .foregroundStyle(accentPink)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 4)
                            .background(accentPink.opacity(0.12), in: Capsule())
                        
                        Text("Fieldy Synced")
                            .font(.caption2.weight(.bold))
                            .textCase(.uppercase)
                            .foregroundStyle(accentOrange)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 4)
                            .background(accentOrange.opacity(0.12), in: Capsule())
                    }
                    .padding(.top, 12)
                    
                    Text("Disney World")
                        .font(.custom("PlayfairDisplay-Bold", size: 44, relativeTo: .largeTitle))
                        .fontWeight(.bold)
                        .foregroundStyle(
                            LinearGradient(
                                colors: [.white, accentOrange, accentPink],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .multilineTextAlignment(.center)
                    
                    Text("A Cinematic Retrospective")
                        .font(.subheadline)
                        .fontWeight(.light)
                        .tracking(3)
                        .foregroundStyle(textSecondary)
                        .textCase(.uppercase)
                }
                
                // MARK: - Interactive Cassette Widget
                VStack(spacing: 16) {
                    ZStack {
                        // Ambient Outer Glowing Aura
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .fill(darkBg)
                            .shadow(color: (isPlaying ? accentPink : accentOrange).opacity(0.25), radius: 15)
                        
                        // Main Cassette Chassis
                        VStack(spacing: 12) {
                            HStack {
                                Text("Omi Cassette v3.0")
                                    .font(.caption2.weight(.semibold))
                                    .foregroundStyle(accentOrange)
                                Spacer()
                                Text("A Side")
                                    .font(.caption2.weight(.bold))
                                    .foregroundStyle(accentPink)
                            }
                            
                            // Tape Windows with Spinning Gears
                            HStack(spacing: 48) {
                                spinningGear
                                spinningGear
                            }
                            .padding(.vertical, 6)
                            
                            HStack(alignment: .bottom) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Will's Personal Lifelog Archive")
                                        .font(.caption.weight(.bold))
                                        .foregroundStyle(.white)
                                    Text("May 18 – 22, 2026 | 57 Enriched Tracks")
                                        .font(.caption2)
                                        .foregroundStyle(textSecondary)
                                }
                                Spacer()
                                
                                // Interactive Play/Pause button
                                Button {
                                    UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                                    withAnimation(.easeInOut) {
                                        isPlaying.toggle()
                                    }
                                } label: {
                                    Image(systemName: isPlaying ? "pause.circle.fill" : "play.circle.fill")
                                        .font(.title2)
                                        .foregroundStyle(isPlaying ? accentPink : accentOrange)
                                }
                            }
                        }
                        .padding(16)
                    }
                    .frame(width: 310, height: 160)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .stroke(
                                LinearGradient(
                                    colors: [accentOrange.opacity(0.6), accentPink.opacity(0.6)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                lineWidth: 1.2
                            )
                    )
                    
                    // Simple animated audio bar wave when playing
                    if isPlaying {
                        HStack(spacing: 3) {
                            ForEach(0..<8) { idx in
                                AudioWaveBar(isPlaying: isPlaying, delay: Double(idx) * 0.15)
                            }
                        }
                        .frame(height: 12)
                    }
                }
                
                // MARK: - Daily Narrative Logs
                VStack(spacing: 40) {
                    ForEach(days) { day in
                        VStack(alignment: .leading, spacing: 16) {
                            // Timeline Node Header
                            HStack(alignment: .center, spacing: 12) {
                                Circle()
                                    .fill(accentOrange)
                                    .frame(width: 8, height: 8)
                                    .shadow(color: accentOrange, radius: 4)
                                
                                Text(day.dayNumber)
                                    .font(.caption2.weight(.bold))
                                    .foregroundStyle(accentPink)
                                    .tracking(1.5)
                                
                                Spacer()
                                
                                Text(day.date)
                                    .font(.caption)
                                    .foregroundStyle(textSecondary)
                            }
                            
                            Text(day.title)
                                .font(.title2.weight(.semibold))
                                .foregroundStyle(.white)
                            
                            // Image Block
                            if let imgName = day.imageName {
                                VStack(alignment: .leading, spacing: 8) {
                                    Image(imgName)
                                        .resizable()
                                        .aspectRatio(contentMode: .fit)
                                        .clipShape(RoundedRectangle(cornerRadius: 12))
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 12)
                                                .stroke(Color.white.opacity(0.08), lineWidth: 1)
                                        )
                                        .shadow(color: Color.black.opacity(0.3), radius: 8, y: 4)
                                    
                                    if let caption = day.imageCaption {
                                        Text(caption)
                                            .font(.caption2.italic())
                                            .foregroundStyle(textSecondary)
                                            .padding(.horizontal, 4)
                                    }
                                }
                                .padding(.vertical, 4)
                            }
                            
                            // Body Narrative Text
                            Text(day.content)
                                .font(.body)
                                .lineSpacing(4)
                                .foregroundStyle(textSecondary)
                            
                            // Logistics Mishap Block
                            if let mishapTitle = day.mishapTitle, let mishapText = day.mishapContent {
                                VStack(alignment: .leading, spacing: 6) {
                                    HStack(spacing: 6) {
                                        Image(systemName: "exclamationmark.triangle.fill")
                                            .font(.caption)
                                        Text(mishapTitle)
                                            .font(.caption.weight(.bold))
                                    }
                                    .foregroundStyle(accentPink)
                                    
                                    Text(mishapText)
                                        .font(.caption)
                                        .font(.system(.caption, design: .serif))
                                        .foregroundStyle(textSecondary.opacity(0.9))
                                        .lineSpacing(3)
                                }
                                .padding(12)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(accentPink.opacity(0.04))
                                .overlay(
                                    Rectangle()
                                        .frame(width: 3.5)
                                        .foregroundStyle(accentPink),
                                    alignment: .leading
                                )
                                .cornerRadius(4)
                            }
                            
                            // Funny Moments Block
                            if let funTitle = day.funMomentTitle, let funText = day.funMomentContent {
                                VStack(alignment: .leading, spacing: 6) {
                                    HStack(spacing: 6) {
                                        Image(systemName: "face.smiling.fill")
                                            .font(.caption)
                                        Text(funTitle)
                                            .font(.caption.weight(.bold))
                                    }
                                    .foregroundStyle(accentOrange)
                                    
                                    Text(funText)
                                        .font(.caption)
                                        .foregroundStyle(textSecondary.opacity(0.9))
                                        .lineSpacing(3)
                                }
                                .padding(12)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(accentOrange.opacity(0.02))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 8)
                                        .stroke(accentOrange.opacity(0.2), lineWidth: 1)
                                )
                                .cornerRadius(8)
                            }
                            
                            Divider()
                                .background(Color.white.opacity(0.08))
                                .padding(.top, 12)
                        }
                    }
                }
                .padding(.horizontal, 20)
            }
            .padding(.vertical, 24)
        }
        .background(darkBg.ignoresSafeArea())
        .navigationTitle("Retrospective")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .toolbarBackground(darkBg, for: .navigationBar)
        .onAppear {
            if isPlaying {
                startGearRotation()
            }
        }
        .onChange(of: isPlaying) { _, playing in
            if playing {
                startGearRotation()
            }
        }
    }
    
    // Spinning Gear Component
    private var spinningGear: some View {
        ZStack {
            // Gear Circle Outline
            Circle()
                .stroke(style: StrokeStyle(lineWidth: 4, lineCap: .round, dash: [4, 6]))
                .frame(width: 40, height: 40)
                .foregroundStyle(textSecondary)
                .rotationEffect(.degrees(rotationAngle))
            
            // Gear Inner hub
            Circle()
                .fill(textSecondary)
                .frame(width: 12, height: 12)
        }
    }
    
    private func startGearRotation() {
        guard !AppTesting.isRunningTests else { return }
        
        withAnimation(.linear(duration: 4.0).repeatForever(autoreverses: false)) {
            rotationAngle = 360.0
        }
    }
}

// MARK: - Animated Wave Bar Helper
struct AudioWaveBar: View {
    let isPlaying: Bool
    let delay: Double
    
    @State private var scale: CGFloat = 0.3
    
    var body: some View {
        RoundedRectangle(cornerRadius: 1.5)
            .fill(Color(red: 0.97, green: 0.15, blue: 0.52).opacity(0.75))
            .frame(width: 3, height: 12)
            .scaleEffect(y: scale, anchor: .bottom)
            .onAppear {
                guard isPlaying && !AppTesting.isRunningTests else { return }
                
                withAnimation(
                    .easeInOut(duration: 0.55)
                    .repeatForever(autoreverses: true)
                    .delay(delay)
                ) {
                    scale = 1.0
                }
            }
    }
}
