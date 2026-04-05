// swift-tools-version: 6.1
import PackageDescription

let package = Package(
    name: "PALACE",
    platforms: [.macOS(.v14)],
    targets: [
        .executableTarget(
            name: "PALACE",
            path: "PALACE"
        ),
    ]
)
