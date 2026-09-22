package com.jellify

import android.content.ContentProvider
import android.content.ContentValues
import android.database.Cursor
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Typeface
import android.net.Uri
import android.os.ParcelFileDescriptor
import java.io.File
import java.io.FileNotFoundException
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

/**
 * Serves Jellyfin artwork to Android Auto, which only loads content:// icon URIs.
 * content://<applicationId>.artwork/<itemId>/<imageType>?tag=<tag>&letter=<A-Z|#>
 * content://<applicationId>.artwork/placeholder?letter=<A-Z|#>
 * Only Jellyfin image paths on the signed-in server can be fetched. When Jellyfin has no
 * image (or no server is known), a letter tile is drawn instead so a card is never blank.
 */
class ArtworkProvider : ContentProvider() {
    companion object {
        @Volatile
        var serverUrl: String? = null

        private val ITEM_ID = Regex("^[0-9a-fA-F]{32}$")
        private val TAG = Regex("^[0-9a-zA-Z]{1,64}$")
        private val IMAGE_TYPES = setOf("Primary", "Backdrop", "Thumb")
        private val LETTER = Regex("^[A-Z#]$")
        private const val SIZE = 400

        /** Letter tile backgrounds; a letter always gets the same one. */
        private val TILE_COLORS = intArrayOf(0xFF4B2A85.toInt(), 0xFF1E6F8E.toInt(), 0xFF2E7D5B.toInt(), 0xFF8E3B5E.toInt(), 0xFFB5652B.toInt(), 0xFF3D4DB7.toInt())
    }

    /** Thrown when the server answered 404: the item has no such image. */
    private class NoImage(message: String) : FileNotFoundException(message)

    override fun onCreate() = true

    override fun getType(uri: Uri) = "image/*"

    override fun openFile(uri: Uri, mode: String): ParcelFileDescriptor {
        val letter = uri.getQueryParameter("letter")?.takeIf { LETTER.matches(it) }
        val segments = uri.pathSegments
        if (segments == listOf("placeholder")) return open(letterTile(letter ?: "#"))
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
                return open(letterTile(letter ?: throw FileNotFoundException("No Jellyfin server")))
            }
            try {
                download("$server/Items/$itemId/Images/$imageType?maxWidth=$SIZE&maxHeight=$SIZE&quality=90&format=Webp" + (tag?.let { "&tag=$it" } ?: ""), file, itemId, imageType)
            } catch (e: NoImage) {
                // Cache the tile under the item's key: the item has no image, so don't ask again.
                // A later upload changes the tag, and with it the key.
                val tile = letterTile(letter ?: throw e)
                val tmp = File.createTempFile(file.name, ".tmp", dir)
                tile.copyTo(tmp, overwrite = true)
                if (!tmp.renameTo(file)) tmp.delete()
                if (!file.exists()) return open(tile)
            } catch (e: FileNotFoundException) {
                // Network trouble: show the tile now, retry the download next time.
                return open(letterTile(letter ?: throw e))
            }
        }
        return open(file)
    }

    private fun open(file: File) = ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)

    /** A square tile with the letter centered, cached per letter. */
    private fun letterTile(letter: String): File {
        val dir = File(context!!.cacheDir, "aa-artwork").apply { mkdirs() }
        val file = File(dir, "letter-${if (letter == "#") "hash" else letter}.png")
        if (file.exists()) return file

        val bitmap = Bitmap.createBitmap(SIZE, SIZE, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        canvas.drawColor(TILE_COLORS[letter[0].code % TILE_COLORS.size])
        val paint =
            Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = 0xFFFFFFFF.toInt()
                textSize = SIZE * 0.5f
                typeface = Typeface.DEFAULT_BOLD
                textAlign = Paint.Align.CENTER
            }
        canvas.drawText(letter, SIZE / 2f, SIZE / 2f - (paint.descent() + paint.ascent()) / 2, paint)

        val tmp = File.createTempFile(file.name, ".tmp", dir)
        try {
            tmp.outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
            if (!tmp.renameTo(file) && !file.exists()) throw FileNotFoundException("Could not cache letter tile")
        } finally {
            bitmap.recycle()
            if (tmp.exists()) tmp.delete()
        }
        return file
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
                if (status == HttpURLConnection.HTTP_NOT_FOUND) throw NoImage("HTTP $status")
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
