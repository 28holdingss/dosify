import SwiftUI

enum DosifyWatchTheme {
    static let cyan = Color(red: 0.35, green: 0.78, blue: 0.95)
    static let blue = Color(red: 0.25, green: 0.55, blue: 0.98)
    static let purple = Color(red: 0.55, green: 0.35, blue: 0.95)
    static let teal = Color(red: 0.25, green: 0.85, blue: 0.78)
    static let danger = Color(red: 0.95, green: 0.25, blue: 0.30)
    static let card = Color.white.opacity(0.06)

    static var actionGradient: LinearGradient {
        LinearGradient(
            colors: [cyan, blue, purple],
            startPoint: .leading,
            endPoint: .trailing
        )
    }

    static var ringGradient: AngularGradient {
        AngularGradient(
            colors: [cyan, blue, purple, cyan],
            center: .center
        )
    }
}

struct GradientTakenButton: View {
    let title: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: "checkmark")
                    .font(.system(size: 13, weight: .bold))
                Text(title)
                    .font(.system(size: 15, weight: .semibold))
            }
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
            .background(DosifyWatchTheme.actionGradient, in: Capsule())
        }
        .buttonStyle(.plain)
    }
}

struct CapsuleArt: View {
    var body: some View {
        ZStack {
            Capsule()
                .fill(
                    LinearGradient(
                        colors: [DosifyWatchTheme.cyan, DosifyWatchTheme.purple],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: 22, height: 40)
                .rotationEffect(.degrees(-28))
                .shadow(color: DosifyWatchTheme.blue.opacity(0.5), radius: 4, y: 2)

            Capsule()
                .fill(.white.opacity(0.22))
                .frame(width: 8, height: 16)
                .offset(x: -3, y: -6)
                .rotationEffect(.degrees(-28))
        }
        .frame(width: 36, height: 44)
    }
}

struct BrandHeader: View {
    var body: some View {
        HStack(spacing: 6) {
            ZStack {
                Circle()
                    .fill(DosifyWatchTheme.actionGradient)
                    .frame(width: 18, height: 18)
                Text("D")
                    .font(.system(size: 10, weight: .black))
                    .foregroundStyle(.white)
            }
            Text("Dosify")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(.white)
            Spacer(minLength: 0)
        }
    }
}
