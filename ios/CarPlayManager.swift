//
//  CarPlayManager.swift
//  Jellify
//
//  Created by Violet Caulfield on 11/1/25.
//

final class CarPlayManager : NSObject {
  static let shared = CarPlayManager()
  
  private var pendingInterfaceController: CPInterfaceController?
  private weak var pendingWindow: CPWindow?
  
  private(set) var isReactNativeReady = false
  
  func attach(interfaceController: CPInterfaceController, carWindow: CPWindow) {
    if isReactNativeReady {
      RNCarPlay.connect(with: interfaceController, window: carWindow)
    } else {
      pendingInterfaceController = interfaceController
      pendingWindow = carWindow
    }
  }
  
  func markReactNativeReady() {
    guard !isReactNativeReady else { return }
    isReactNativeReady = true
    
    if let interfaceController = pendingInterfaceController, let carWindow = pendingWindow {
      RNCarPlay.connect(with: interfaceController, window: carWindow)
      pendingInterfaceController = nil
      pendingWindow = nil
    }
  }
  
  func disconnect(reactNativeReady: Bool = true) {
    isReactNativeReady = reactNativeReady
    RNCarPlay.disconnect()
    pendingInterfaceController = nil
    pendingWindow = nil
  }
}
