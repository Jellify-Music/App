// ios/AppDelegate.swift
import UIKit
import CarPlay
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import react_native_ota_hot_update
import GoogleCast



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
    return OtaHotUpdate.getBundle()  // -> Add this line

    #endif
  }
}
