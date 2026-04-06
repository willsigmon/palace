import SwiftUI
import Contacts

struct PeopleView: View {
    @State private var people: [Person] = []
    @State private var searchText = ""
    @State private var loading = true
    @State private var contactImages: [String: Data] = [:] // keyed by phone/email/name

    // Group labels for display
    private let groupOrder = ["family", "contact", "colleague", "friend", "other"]
    private let groupLabels: [String: String] = [
        "family": "Family",
        "contact": "Contacts",
        "colleague": "Work",
        "friend": "Friends",
        "other": "Other",
    ]

    // Filter out deceased/genealogy-only and phone-number-only entries
    private var activePeople: [Person] {
        people.filter { !$0.isLikelyDeceased && !$0.isPhoneNumberOnly }
    }

    private var filtered: [Person] {
        if searchText.isEmpty { return activePeople }
        return activePeople.filter { $0.displayLabel.localizedCaseInsensitiveContains(searchText) }
    }

    private var grouped: [(key: String, people: [Person])] {
        let dict = Dictionary(grouping: filtered) { $0.groupKey }
        return groupOrder
            .compactMap { key in
                guard let group = dict[key], !group.isEmpty else { return nil }
                return (key: key, people: group.sorted { $0.displayLabel < $1.displayLabel })
            }
            + dict
                .filter { !groupOrder.contains($0.key) && !$0.value.isEmpty }
                .map { (key: $0.key, people: $0.value.sorted { $0.displayLabel < $1.displayLabel }) }
                .sorted { $0.key < $1.key }
    }

    var body: some View {
        NavigationStack {
            List {
                ForEach(grouped, id: \.key) { group in
                    Section(groupLabels[group.key] ?? group.key.capitalized) {
                        ForEach(group.people) { person in
                            PersonRow(person: person, contactImageData: contactImages[person.phone ?? person.name])
                        }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("People")
            .searchable(text: $searchText, prompt: "Search people")
            .refreshable { await loadData() }
            .task {
                await loadData()
                await loadContactPhotos()
            }
            .overlay {
                if loading && people.isEmpty { ProgressView() }
            }
        }
    }

    private func loadData() async {
        do { people = try await APIClient.shared.getPeople(limit: 500) } catch {}
        loading = false
    }

    private func loadContactPhotos() async {
        let store = CNContactStore()
        do {
            try await store.requestAccess(for: .contacts)
            let keysToFetch: [CNKeyDescriptor] = [
                CNContactGivenNameKey as CNKeyDescriptor,
                CNContactFamilyNameKey as CNKeyDescriptor,
                CNContactPhoneNumbersKey as CNKeyDescriptor,
                CNContactEmailAddressesKey as CNKeyDescriptor,
                CNContactThumbnailImageDataKey as CNKeyDescriptor,
            ]
            let request = CNContactFetchRequest(keysToFetch: keysToFetch)
            var images: [String: Data] = [:]

            try store.enumerateContacts(with: request) { contact, _ in
                guard let imageData = contact.thumbnailImageData else { return }
                // Match by phone number
                for phone in contact.phoneNumbers {
                    let digits = phone.value.stringValue.filter(\.isNumber)
                    if digits.count >= 10 {
                        images["+1\(digits.suffix(10))"] = imageData
                        images[digits] = imageData
                    }
                }
                // Match by name
                let fullName = "\(contact.givenName) \(contact.familyName)".trimmingCharacters(in: .whitespaces)
                if !fullName.isEmpty {
                    images[fullName] = imageData
                }
            }
            await MainActor.run { contactImages = images }
        } catch {}
    }
}

struct PersonRow: View {
    let person: Person
    let contactImageData: Data?

    var body: some View {
        HStack(spacing: 12) {
            // Avatar — contact photo or initials
            if let imageData = contactImageData, let uiImage = UIImage(data: imageData) {
                Image(uiImage: uiImage)
                    .resizable()
                    .scaledToFill()
                    .frame(width: 44, height: 44)
                    .clipShape(Circle())
            } else {
                Circle()
                    .fill(colorForRelationship(person.relationship))
                    .frame(width: 44, height: 44)
                    .overlay(
                        Text(person.initials)
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(.white)
                    )
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(person.displayLabel)
                    .font(.body)
                    .fontWeight(.medium)

                if let detail = person.relationshipDetail, !detail.isEmpty {
                    Text(detail)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                } else if let rel = person.relationship {
                    Text(rel)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            if let count = person.conversationCount, count > 0 {
                Text("\(count)")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
                    .monospacedDigit()
            }
        }
        .padding(.vertical, 2)
    }

    private func colorForRelationship(_ rel: String?) -> Color {
        switch rel {
        case "family": return .orange
        case "contact": return .blue
        case "colleague": return .purple
        case "friend": return .green
        default: return .gray
        }
    }
}
