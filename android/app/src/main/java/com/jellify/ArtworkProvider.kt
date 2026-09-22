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
        val server = serverUrl?.trimEnd('/') ?: throw FileNotFoundException("No Jellyfin server")
        val dir = File(context!!.cacheDir, "aa-artwork").apply { mkdirs() }
        val file = File(dir, "$itemId-$imageType-${tag ?: "none"}.webp")

        // ponytail: no cache eviction; Android clears cacheDir under storage pressure.
        if (!file.exists()) download("$server/Items/$itemId/Images/$imageType?maxWidth=$SIZE&maxHeight=$SIZE&quality=90&format=Webp" + (tag?.let { "&tag=$it" } ?: ""), file)
        return ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)
    }

    private fun download(url: String, target: File) {
        val connection = URL(url).openConnection() as HttpURLConnection
        connection.connectTimeout = 5_000
        connection.readTimeout = 10_000
        // Concurrent requests for the same image (e.g. every track row on an album page)
        // must not share one ".tmp" file — each gets its own, and a losing renameTo is fine
        // as long as another request already produced the target.
        val tmp = File.createTempFile(target.name, ".tmp", target.parentFile)
        try {
            if (connection.responseCode != HttpURLConnection.HTTP_OK) throw FileNotFoundException("HTTP ${connection.responseCode}")
            connection.inputStream.use { input -> tmp.outputStream().use { input.copyTo(it) } }
            if (!tmp.renameTo(target) && !target.exists()) throw FileNotFoundException("Could not cache artwork")
        } catch (e: IOException) {
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
