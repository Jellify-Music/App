// ios/AppDelegate.swift
import UIKit
import CarPlay
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import GoogleCast
import NitroOtaBundleManager




@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  
  var window: UIWindow?
  
  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?
  
  func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
    
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    
    delegate.dependencyProvider = RCTAppDependencyProvider()
    
    reactNativeDelegate = delegate
    reactNativeFactory = factory
    
    window = UIWindow(frame: UIScreen.main.bounds)

    let receiverAppID = kGCKDefaultMediaReceiverApplicationID // or "ABCD1234"
    let criteria = GCKDiscoveryCriteria(applicationID: receiverAppID)
    let options = GCKCastOptions(discoveryCriteria: criteria)
    
    // Enable volume control with the physical buttons
    options.physicalVolumeButtonsWillControlDeviceVolume = true
    
    GCKCastContext.setSharedInstanceWith(options)

    // Debug helper: if launched with --clear-ota argument, wipe any stored Nitro OTA bundle
    if ProcessInfo.processInfo.arguments.contains("--clear-ota") {
      NitroOtaBundleManager.shared.clearStoredData()
      print("[AppDelegate] Cleared Nitro OTA stored data (--clear-ota)")
    }

    // Debug helper: if environment SKIP_NITRO_OTA=1 is set, clear stored OTA data for this run
    if ProcessInfo.processInfo.environment["SKIP_NITRO_OTA"] == "1" {
      NitroOtaBundleManager.shared.clearStoredData()
      print("[AppDelegate] SKIP_NITRO_OTA=1 detected; cleared Nitro OTA stored data for this run")
    }

    // Log the resolved JS bundle URL so we can tell whether the app will use an OTA bundle or embedded bundle
    if let resolvedURL = delegate.bundleURL() {
      print("[AppDelegate] Resolved RN bundle URL: \(resolvedURL.absoluteString)")
    } else {
      print("[AppDelegate] No RN bundle URL resolved (nil)")
    }

    factory.startReactNative(
      withModuleName: "Jellify",
      in: window,
      launchOptions: launchOptions
    )
    
    return true
  }
  
  func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
    if (connectingSceneSession.role == UISceneSession.Role.carTemplateApplication) {
      let scene =  UISceneConfiguration(name: "CarPlay", sessionRole: connectingSceneSession.role)
      scene.delegateClass = CarSceneDelegate.self
      return scene
    } else {
      let scene =  UISceneConfiguration(name: "Phone", sessionRole: connectingSceneSession.role)
      scene.delegateClass = PhoneSceneDelegate.self
      return scene
    }
  }
  
  func application(_ application: UIApplication, didDiscardSceneSessions sceneSessions: Set<UISceneSession>) {
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
    #if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index");
    #else
     // Check for OTA bundle first
    if let bundleURL = NitroOtaBundleManager.shared.getStoredBundleURL() {
      return bundleURL
    }
    // Fallback to main bundle
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")

    #endif
  }
}
