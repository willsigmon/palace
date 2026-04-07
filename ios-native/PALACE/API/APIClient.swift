import Foundation

enum PALACEEnvironment {
    private static let environment = ProcessInfo.processInfo.environment

    static let apiBaseURL = URL(string: environment["PALACE_API_URL"] ?? "https://api.wsig.me")!
    static let marlinBaseURL = URL(string: environment["PALACE_MARLIN_URL"] ?? "https://marlin.sigflix.stream")!

    static var marlinHealthURL: URL {
        marlinBaseURL.appendingPathComponent("health")
    }

    static func apiURL(path: String, queryItems: [URLQueryItem] = []) -> URL {
        var components = URLComponents(url: apiBaseURL.appendingPathComponent(normalizedPath(path)), resolvingAgainstBaseURL: false)!
        if !queryItems.isEmpty {
            components.queryItems = queryItems
        }
        return components.url!
    }

    static func marlinURL(path: String) -> URL {
        marlinBaseURL.appendingPathComponent(normalizedPath(path))
    }

    private static func normalizedPath(_ path: String) -> String {
        path.hasPrefix("/") ? String(path.dropFirst()) : path
    }
}

/// wsigomi REST API client
actor APIClient {
    static let shared = APIClient()

    private let decoder = JSONDecoder()

    private func request<T: Decodable>(_ path: String, params: [String: String] = [:]) async throws -> T {
        let queryItems = params.map { URLQueryItem(name: $0.key, value: $0.value) }
        let (data, _) = try await URLSession.shared.data(from: PALACEEnvironment.apiURL(path: path, queryItems: queryItems))
        return try decoder.decode(T.self, from: data)
    }

    func getConversations(limit: Int = 25, offset: Int = 0, query: String? = nil, category: String? = nil) async throws -> [Conversation] {
        var params: [String: String] = ["limit": "\(limit)", "offset": "\(offset)"]
        if let q = query { params["query"] = q }
        if let c = category { params["category"] = c }
        return try await request("/api/conversations", params: params)
    }

    func getConversation(id: Int) async throws -> ConversationDetail {
        return try await request("/api/conversations/\(id)")
    }

    func getStats() async throws -> Stats {
        return try await request("/api/stats")
    }

    func getPeople(limit: Int = 25, query: String? = nil) async throws -> [Person] {
        var params: [String: String] = ["limit": "\(limit)"]
        if let q = query { params["query"] = q }
        return try await request("/api/people", params: params)
    }

    func getMemories(limit: Int = 25, query: String? = nil) async throws -> [Memory] {
        var params: [String: String] = ["limit": "\(limit)"]
        if let q = query { params["query"] = q }
        return try await request("/api/memories", params: params)
    }

    func search(query: String, limit: Int = 25) async throws -> SearchResponse {
        return try await request("/api/search", params: ["query": query, "limit": "\(limit)"])
    }

    func getTimeline(date: String) async throws -> TimelineResponse {
        return try await request("/api/timeline", params: ["date": date])
    }

    func ask(question: String) async throws -> AskResponse {
        var req = URLRequest(url: PALACEEnvironment.apiURL(path: "/api/ask"))
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try JSONEncoder().encode(["question": question])
        let (data, _) = try await URLSession.shared.data(for: req)
        return try decoder.decode(AskResponse.self, from: data)
    }
}
