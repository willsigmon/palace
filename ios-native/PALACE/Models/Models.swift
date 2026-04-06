import Foundation

struct Conversation: Codable, Identifiable {
    let id: Int
    let title: String?
    let overview: String?
    let emoji: String?
    let category: String?
    let startedAt: String?
    let finishedAt: String?
    let sessionType: String?

    // Accept and ignore unknown keys from the API
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(Int.self, forKey: .id)
        title = try c.decodeIfPresent(String.self, forKey: .title)
        overview = try c.decodeIfPresent(String.self, forKey: .overview)
        emoji = try c.decodeIfPresent(String.self, forKey: .emoji)
        category = try c.decodeIfPresent(String.self, forKey: .category)
        startedAt = try c.decodeIfPresent(String.self, forKey: .startedAt)
        finishedAt = try c.decodeIfPresent(String.self, forKey: .finishedAt)
        sessionType = try c.decodeIfPresent(String.self, forKey: .sessionType)
    }

    private enum CodingKeys: String, CodingKey {
        case id, title, overview, emoji, category, startedAt, finishedAt, sessionType
    }
}

struct ConversationDetail: Codable {
    let session: Conversation
    let segments: [Segment]
    let speakerNames: [String: String]
}

struct Segment: Codable, Identifiable {
    var id: String { "\(speaker)-\(startTime)" }
    let text: String
    let speaker: Int
    let speakerLabel: String?
    let speakerName: String?
    let isUser: Bool
    let startTime: Double
    let endTime: Double

    // Convenience for display
    var startedAt: Double { startTime }
    var endedAt: Double { endTime }
}

struct Person: Codable, Identifiable {
    let id: Int
    let name: String
    let displayName: String?
    let relationship: String?
    let relationshipDetail: String?
    let conversationCount: Int?
    let photoPath: String?
    let phone: String?
    let email: String?
    let birthday: String?
    let gedcomId: String?

    // Filter: GEDCOM entries without phone/email/conversationCount are likely historical/deceased
    var isLikelyDeceased: Bool {
        guard gedcomId != nil else { return false }
        // Has GEDCOM ID but no phone, no email, and no conversation count = genealogy-only
        return phone == nil && email == nil && (conversationCount ?? 0) == 0
    }

    var isPhoneNumberOnly: Bool {
        name.hasPrefix("+") || name.allSatisfy { $0.isNumber || $0 == "+" || $0 == "-" || $0 == " " || $0 == "(" || $0 == ")" }
    }

    var groupKey: String {
        relationship ?? "other"
    }

    var displayLabel: String {
        displayName ?? name
    }

    var initials: String {
        let parts = displayLabel.split(separator: " ")
        if parts.count >= 2 {
            return String(parts[0].prefix(1) + parts[1].prefix(1)).uppercased()
        }
        return String(displayLabel.prefix(2)).uppercased()
    }
}

struct Memory: Codable, Identifiable {
    let id: Int
    let content: String
    let category: String?
    let createdAt: String
}

struct Stats: Codable {
    let conversations: Int
    let memories: Int
    let people: Int
}

struct SearchResponse: Codable {
    let conversations: [Conversation]
    let memories: [Memory]
}

struct AskResponse: Codable {
    let question: String
    let answer: String
    let sources: Sources?

    struct Sources: Codable {
        let conversations: [SourceConversation]?
        let memories: Int?
        let people: [String]?
    }

    struct SourceConversation: Codable, Identifiable {
        let id: Int
        let title: String?
        let date: String?
    }
}

struct TimelineResponse: Codable {
    let date: String
    let events: [TimelineEvent]
}

struct TimelineEvent: Codable, Identifiable {
    var id: String { "\(type)-\(time)-\(data.id ?? 0)" }
    let time: String
    let type: String
    let data: TimelineEventData
}

struct TimelineEventData: Codable {
    let id: Int?
    let title: String?
    let overview: String?
    let startedAt: String?
    let finishedAt: String?
    let category: String?
    let content: String?
}

struct ChatMessage: Identifiable {
    let id = UUID()
    let role: Role
    let text: String
    let audioBase64: String?
    let model: String?
    let timings: MarlinClient.VoiceResponse.Timings?

    enum Role {
        case user
        case marlin
    }
}
