import SwiftUI

struct MarlinAvatarView: View {
    let size: CGFloat

    var body: some View {
        if let img = UIImage(named: "MarlinAvatar") {
            Image(uiImage: img)
                .resizable()
                .scaledToFill()
                .frame(width: size, height: size)
                .clipShape(Circle())
        } else {
            Circle()
                .fill(LinearGradient(colors: [.orange, .pink], startPoint: .topLeading, endPoint: .bottomTrailing))
                .frame(width: size, height: size)
                .overlay(
                    Text("M")
                        .font(.system(size: size * 0.38, weight: .heavy))
                        .foregroundStyle(.white)
                )
        }
    }
}
