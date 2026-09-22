package com.jellify

import android.content.ContentProvider
import android.content.ContentValues
import android.database.Cursor
import android.net.Uri
import android.os.ParcelFileDescriptor
import java.io.File
import java.io.FileNotFoundException
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

/**
 * Serves Jellyfin artwork to Android Auto, which only loads content:// icon URIs.
 * content://<applicationId>.artwork/<itemId>/<imageType>?tag=<tag>
 * Only Jellyfin image paths on the signed-in server can be fetched.
 */
class ArtworkProvider : ContentProvider() {
    companion object {
        @Volatile
        var serverUrl: String? = null

        private val ITEM_ID = Regex("^[0-9a-fA-F]{32}$")
        private val TAG = Regex("^[0-9a-zA-Z]{1,64}$")
        private val IMAGE_TYPES = setOf("Primary", "Backdrop", "Thumb")
        private const val SIZE = 400
    }

    override fun onCreate() = true

    override fun getType(uri: Uri) = "image/webp"

    override fun openFile(uri: Uri, mode: String): ParcelFileDescriptor {
        val segments = uri.pathSegments
        if (segments.size != 2) throw FileNotFoundException(uri.toString())
        val (itemId, imageType) = segments
        if (!ITEM_ID.matches(itemId) || imageType !in IMAGE_TYPES) throw FileNotFoundException(uri.toString())
        val tag = uri.getQueryParameter("tag")?.takeIf { TAG.matches(it) }
        val dir = File(context!!.cacheDir, "aa-artwork").apply { mkdirs() }
        val file = File(dir, "$itemId-$imageType-${tag ?: "none"}.webp")

        // ponytail: no cache eviction; Android clears cacheDir under storage pressure.
        // ponytail: openFile blocks a binder thread for the download (5s connect + 10s read)
        // when the cache misses. Acceptable, same as UAMP's AlbumArtContentProvider; upgrade
        // path is a prefetch/async cache filled ahead of Android Auto asking for these rows.
        if (!file.exists()) {
            val server = serverUrl?.trimEnd('/')
            if (server == null) {
                android.util.Log.w("JellifyArtwork", "No Jellyfin server for item=$itemId type=$imageType")
                throw FileNotFoundException("No Jellyfin server")
            }
            download("$server/Items/$itemId/Images/$imageType?maxWidth=$SIZE&maxHeight=$SIZE&quality=90&format=Webp" + (tag?.let { "&tag=$it" } ?: ""), file, itemId, imageType)
        }
        return ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)
    }

    private fun download(url: String, target: File, itemId: String, imageType: String) {
        val connection = URL(url).openConnection() as HttpURLConnection
        connection.connectTimeout = 5_000
        connection.readTimeout = 10_000
        // Concurrent requests for the same image (e.g. every track row on an album page)
        // must not share one ".tmp" file — each gets its own, and a losing renameTo is fine
        // as long as another request already produced the target.
        val tmp = File.createTempFile(target.name, ".tmp", target.parentFile)
        try {
            val status = connection.responseCode
            if (status != HttpURLConnection.HTTP_OK) {
                android.util.Log.w("JellifyArtwork", "Download failed item=$itemId type=$imageType status=$status")
                throw FileNotFoundException("HTTP $status")
            }
            connection.inputStream.use { input -> tmp.outputStream().use { input.copyTo(it) } }
            if (!tmp.renameTo(target) && !target.exists()) throw FileNotFoundException("Could not cache artwork")
        } catch (e: FileNotFoundException) {
            throw e // already logged above (status) or not a network failure (rename)
        } catch (e: IOException) {
            android.util.Log.w("JellifyArtwork", "Download failed item=$itemId type=$imageType exception=${e.javaClass.simpleName}")
            throw FileNotFoundException(e.message)
        } finally {
            connection.disconnect()
            if (tmp.exists()) tmp.delete()
        }
    }

    override fun query(uri: Uri, projection: Array<out String>?, selection: String?, selectionArgs: Array<out String>?, sortOrder: String?): Cursor? = null
    override fun insert(uri: Uri, values: ContentValues?): Uri? = null
    override fun delete(uri: Uri, selection: String?, selectionArgs: Array<out String>?) = 0
    override fun update(uri: Uri, values: ContentValues?, selection: String?, selectionArgs: Array<out String>?) = 0
}
