package com.jellify

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.margelo.nitro.nitroplayer.media.MediaLibraryManager
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger

/**
 * Bridges nitro-player's on-demand Android Auto folder loading to JS:
 * native asks via the "JellifyAndroidAutoLoadChildren" event, JS answers with resolveChildren.
 */
class AndroidAutoBrowseModule(
    private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
    // ponytail: an entry outlives a native-side timeout until JS eventually calls
    // resolveChildren; unbounded in theory, but bounded in practice by how many
    // folders a user taps. Add eviction if this ever shows up as a real leak.
    private val pending = ConcurrentHashMap<String, (String?) -> Unit>()
    private val nextRequestId = AtomicInteger()

    override fun getName() = NAME

    @ReactMethod
    fun registerChildrenLoader() {
        MediaLibraryManager.getInstance(reactContext).childrenLoader =
            MediaLibraryManager.ChildrenLoader { parentId, onResult ->
                val requestId = nextRequestId.incrementAndGet().toString()
                pending[requestId] = onResult
                reactContext.emitDeviceEvent(
                    LOAD_CHILDREN_EVENT,
                    Arguments.createMap().apply {
                        putString("requestId", requestId)
                        putString("parentId", parentId)
                    },
                )
            }
    }

    @ReactMethod
    fun resolveChildren(requestId: String, itemsJson: String?) {
        pending.remove(requestId)?.invoke(itemsJson)
    }

    @ReactMethod
    fun setArtworkServer(url: String?) {
        ArtworkProvider.serverUrl = url
    }

    companion object {
        const val NAME = "JellifyAndroidAuto"
        const val LOAD_CHILDREN_EVENT = "JellifyAndroidAutoLoadChildren"
    }
}
