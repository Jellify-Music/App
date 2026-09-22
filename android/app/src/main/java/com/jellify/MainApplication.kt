package com.jellify

import  android.app.Application
import android.os.Build
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import com.margelo.nitro.nitroota.core.getStoredBundlePath
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import androidx.work.WorkManager



class MainApplication : Application(), ReactApplication {


  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
          add(JellifyPackage())
        },
        jsBundleFilePath = getStoredBundlePath(applicationContext)
    )
  }
  


  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
    // Cancel any stale WorkManager tasks left over from previous sessions
    // as to avoid a TooManyRequestsException.
    WorkManager.getInstance(this).cancelAllWork()
    // Android Auto binds NitroPlayerMediaBrowserService without ever launching
    // MainActivity, so on a cold process start nothing would boot the JS runtime
    // that publishes the media library. Start it eagerly; the Activity reuses it.
    // Skip auxiliary processes such as nitro-ota's :phoenix, which spins up its own
    // short-lived Application instance during a live OTA restart and doesn't need it.
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P || getProcessName() == packageName) {
      reactHost.start()
    }
  }
}
