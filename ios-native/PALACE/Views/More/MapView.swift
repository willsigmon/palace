import SwiftUI
import MapKit

struct LocationMapView: View {
    @State private var locations: [LocationPoint] = []
    @State private var loading = true
    @State private var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 35.78, longitude: -78.64),
        span: MKCoordinateSpan(latitudeDelta: 0.5, longitudeDelta: 0.5)
    )

    var body: some View {
        ZStack {
            Map(coordinateRegion: $region, annotationItems: locations) { loc in
                MapAnnotation(coordinate: loc.coordinate) {
                    Circle()
                        .fill(.orange.opacity(0.7))
                        .frame(width: max(6, CGFloat(loc.count) * 2), height: max(6, CGFloat(loc.count) * 2))
                        .shadow(color: .orange.opacity(0.3), radius: 4)
                }
            }
            .ignoresSafeArea(edges: .bottom)

            if loading {
                ProgressView()
                    .padding()
                    .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
            }
        }
        .navigationTitle("Map")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadLocations() }
    }

    private func loadLocations() async {
        do {
            let url = PALACEEnvironment.apiURL(
                path: "/api/locations",
                queryItems: [URLQueryItem(name: "limit", value: "500")]
            )
            let (data, _) = try await URLSession.shared.data(from: url)
            let raw = try JSONDecoder().decode([RawLocation].self, from: data)

            // Cluster by rounding to 3 decimal places
            var clusters: [String: LocationPoint] = [:]
            for loc in raw {
                let key = "\(String(format: "%.3f", loc.latitude)),\(String(format: "%.3f", loc.longitude))"
                if var existing = clusters[key] {
                    existing.count += 1
                    clusters[key] = existing
                } else {
                    clusters[key] = LocationPoint(
                        latitude: loc.latitude, longitude: loc.longitude,
                        label: loc.label, count: 1
                    )
                }
            }
            let points = Array(clusters.values)
            await MainActor.run {
                locations = points
                if let first = points.first {
                    let lats = points.map(\.latitude)
                    let lons = points.map(\.longitude)
                    let center = CLLocationCoordinate2D(
                        latitude: (lats.min()! + lats.max()!) / 2,
                        longitude: (lons.min()! + lons.max()!) / 2
                    )
                    let span = MKCoordinateSpan(
                        latitudeDelta: max(0.1, (lats.max()! - lats.min()!) * 1.3),
                        longitudeDelta: max(0.1, (lons.max()! - lons.min()!) * 1.3)
                    )
                    region = MKCoordinateRegion(center: center, span: span)
                }
            }
        } catch {
            print("Map load error: \(error)")
        }
        loading = false
    }
}

struct RawLocation: Codable {
    let latitude: Double
    let longitude: Double
    let label: String?
}

struct LocationPoint: Identifiable {
    let id = UUID()
    let latitude: Double
    let longitude: Double
    let label: String?
    var count: Int

    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }
}
