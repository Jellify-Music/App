package com.jellify

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

/** Registers Jellify's own native modules (currently: the Android Auto browse bridge). */
class JellifyPackage : BaseReactPackage() {
    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
        if (name == AndroidAutoBrowseModule.NAME) AndroidAutoBrowseModule(reactContext) else null

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
        mapOf(
            AndroidAutoBrowseModule.NAME to
                ReactModuleInfo(
                    AndroidAutoBrowseModule.NAME,
                    AndroidAutoBrowseModule.NAME,
                    false, // canOverrideExistingModule
                    false, // needsEagerInit
                    false, // isCxxModule
                    true, // isTurboModule
                ),
        )
    }
}
