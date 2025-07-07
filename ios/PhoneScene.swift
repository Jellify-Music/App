import Foundation
import UIKit
import SwiftUI


extension UIColor {
    convenience init(hex: String) {
        var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")

        var rgb: UInt64 = 0
        Scanner(string: hexSanitized).scanHexInt64(&rgb)

        let r = (rgb & 0xFF0000) >> 16
        let g = (rgb & 0x00FF00) >> 8
        let b = rgb & 0x0000FF

        self.init(
            red: CGFloat(r) / 255,
            green: CGFloat(g) / 255,
            blue: CGFloat(b) / 255,
            alpha: 1.0
        )
    }
}



class PhoneSceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate else { return }
    guard let windowScene = scene as? UIWindowScene else { return }

    // Set up the window
    let window = UIWindow(windowScene: windowScene)
    window.rootViewController = appDelegate.window?.rootViewController
    self.window = window
    window.makeKeyAndVisible()
  }
}
