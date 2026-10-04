package com.jellify

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import com.jellify.specs.NativeJellifyAndroidAutoSpec
import com.margelo.nitro.nitroplayer.media.MediaLibraryManager
import com.margelo.nitro.nitroplayer.media.SessionCustomButtons
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger

/**
 * Bridges nitro-player's on-demand Android Auto folder loading and search to JS:
 * native asks through the `onLoadChildren` / `onSearch` events, JS answers with
 * resolveChildren / resolveSearch. Also drives the favourite (heart) button on the
 * playback screen.
 */
@ReactModule(name = AndroidAutoBrowseModule.NAME)
class AndroidAutoBrowseModule(
    private val reactContext: ReactApplicationContext,
) : NativeJellifyAndroidAutoSpec(reactContext) {
    // ponytail: an entry outlives a native-side timeout until JS eventually calls
    // resolveChildren; unbounded in theory, but bounded in practice by how many
    // folders a user taps. Add eviction if this ever shows up as a real leak.
    private val pending = ConcurrentHashMap<String, (String?) -> Unit>()
    private val nextRequestId = AtomicInteger()

    /** Remembers `onResult` under a fresh id and hands that id to JS. */
    private fun request(onResult: (String?) -> Unit): String {
        val requestId = nextRequestId.incrementAndGet().toString()
        pending[requestId] = onResult
        return requestId
    }

    override fun registerChildrenLoader() {
        MediaLibraryManager.getInstance(reactContext).childrenLoader =
            MediaLibraryManager.ChildrenLoader { parentId, onResult ->
                val requestId = request(onResult)
                emitOnLoadChildren(
                    Arguments.createMap().apply {
                        putString("requestId", requestId)
                        putString("parentId", parentId)
                    },
                )
            }
    }

    override fun resolveChildren(requestId: String, itemsJson: String?) {
        pending.remove(requestId)?.invoke(itemsJson)
    }

    override fun registerSearchProvider() {
        MediaLibraryManager.getInstance(reactContext).searchLoader =
            MediaLibraryManager.SearchLoader { query, onResult ->
                val requestId = request(onResult)
                emitOnSearch(
                    Arguments.createMap().apply {
                        putString("requestId", requestId)
                        putString("query", query)
                    },
                )
            }
    }

    override fun resolveSearch(requestId: String, itemsJson: String?) {
        pending.remove(requestId)?.invoke(itemsJson)
    }

    override fun setArtworkServer(url: String?) {
        ArtworkProvider.serverUrl = url
    }

    /** Shows the heart for the playing track: "favorite" (filled), "not-favorite", or null to hide it. */
    override fun setFavoriteButton(state: String?) {
        SessionCustomButtons.onPressed = { action ->
            emitOnCustomAction(Arguments.createMap().apply { putString("action", action) })
        }
        SessionCustomButtons.set(
            when (state) {
                "favorite" -> listOf(SessionCustomButtons.Button(FAVORITE_ACTION, "Remove from favourites", "heart_filled"))
                "not-favorite" -> listOf(SessionCustomButtons.Button(FAVORITE_ACTION, "Add to favourites", "heart"))
                else -> emptyList()
            },
        )
    }

    companion object {
        const val NAME = "JellifyAndroidAuto"
        const val FAVORITE_ACTION = "com.jellify.FAVORITE"
    }
}
