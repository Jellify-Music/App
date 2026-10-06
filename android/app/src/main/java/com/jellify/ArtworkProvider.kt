package com.jellify

import android.content.ContentProvider
import android.content.ContentValues
import android.database.Cursor
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.Typeface
import android.net.Uri
import android.os.ParcelFileDescriptor
import java.io.File
import java.io.FileNotFoundException
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest
import java.util.concurrent.Callable
import java.util.concurrent.Executors
import java.util.concurrent.Semaphore
import java.util.concurrent.TimeUnit

/**
 * Serves Jellyfin artwork to Android Auto, which only loads content:// icon URIs.
 * content://<applicationId>.artwork/<itemId>/<imageType>?tag=<tag>&letter=<A-Z|#>
 * content://<applicationId>.artwork/placeholder?letter=<A-Z|#>
 * content://<applicationId>.artwork/collage?letter=<A-Z|#>&items=<itemId>.<type>.<tag>,…
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
        private const val MAX_COLLAGE = 9
        private const val COLLAGE_BACKGROUND = 0xFF202124.toInt()

        /** Downloads a collage's covers in parallel instead of one after another. */
        private val COLLAGE_POOL = Executors.newFixedThreadPool(4)

        /** Collages built at once; more get the letter tile instead of holding a binder thread. */
        private val COLLAGE_SLOTS = Semaphore(4)
        private const val COLLAGE_TIMEOUT_S = 8L

        /**
         * Downloads running at once, across every tile and collage. Opening a tab can ask for
         * hundreds of covers, and each one costs the server a resize: a Jellyfin box with other
         * work to do stops answering anything if we ask for them all at once.
         */
        private val FETCH_SLOTS = Semaphore(3)
        private const val FETCH_TIMEOUT_S = 5L

        /** Cached artwork kept on disk; past this the least recently used files go. */
        private const val MAX_CACHE_BYTES = 200L * 1024 * 1024

        /** Files written since the last sweep; sweeping every time would stat the whole directory. */
        private val writesSinceSweep = java.util.concurrent.atomic.AtomicInteger()
        private const val WRITES_PER_SWEEP = 100

        /** Marks a cover whose download failed (as opposed to one the server doesn't have). */
        private val FAILED = File("")

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
        if (segments == listOf("collage")) return collage(uri.getQueryParameter("items").orEmpty(), letter ?: "#")
        if (segments.size != 2) throw FileNotFoundException(uri.toString())
        val (itemId, imageType) = segments
        if (!ITEM_ID.matches(itemId) || imageType !in IMAGE_TYPES) throw FileNotFoundException(uri.toString())
        val tag = uri.getQueryParameter("tag")?.takeIf { TAG.matches(it) }

        return try {
            // No server or network trouble: show the tile now, retry the download next time.
            open(image(itemId, imageType, tag) ?: letterTile(letter ?: throw FileNotFoundException(uri.toString())))
        } catch (e: NoImage) {
            open(letterTile(letter ?: throw e))
        }
    }

    /**
     * Artwork lives in `filesDir`, not `cacheDir`: a letter tile is a collage of up to nine
     * covers, so a tab that loses its cache costs the server hundreds of resizes to draw again.
     * Android empties `cacheDir` whenever storage runs short, which would repeat that burst;
     * here the fill happens once and only new or re-tagged covers are fetched afterwards.
     * [sweepCache] keeps the directory bounded, since nothing else prunes it.
     */
    private fun artworkDir() = File(context!!.filesDir, "aa-artwork").apply { mkdirs() }

    private fun imageFile(itemId: String, imageType: String, tag: String?) = File(artworkDir(), "$itemId-$imageType-${tag ?: "none"}.webp")

    /**
     * The item's image from the cache, else downloaded from the signed-in server; null when no
     * server is known or the download fails. Throws [NoImage] when the server has no such image;
     * that answer is remembered with an empty marker file, so it isn't asked again (a later
     * upload changes the tag, and with it the key).
     */
    private fun image(itemId: String, imageType: String, tag: String?): File? {
        val file = imageFile(itemId, imageType, tag)
        if (file.exists()) {
            // Touch it so [sweepCache] evicts what nobody looks at, not what was fetched first.
            runCatching { file.setLastModified(System.currentTimeMillis()) }
            return file
        }
        val missing = File(file.path + ".missing")
        if (missing.exists()) throw NoImage("No image for item=$itemId type=$imageType")

        // ponytail: openFile blocks a binder thread for the download (5s connect + 10s read)
        // when the cache misses. Acceptable, same as UAMP's AlbumArtContentProvider; upgrade
        // path is a prefetch/async cache filled ahead of Android Auto asking for these rows.
        val server = serverUrl?.trimEnd('/')
        if (server == null) {
            android.util.Log.w("JellifyArtwork", "No Jellyfin server for item=$itemId type=$imageType")
            return null
        }
        if (!FETCH_SLOTS.tryAcquire(FETCH_TIMEOUT_S, TimeUnit.SECONDS)) {
            android.util.Log.w("JellifyArtwork", "Busy fetching artwork, skipping item=$itemId type=$imageType")
            return null
        }
        return try {
            download("$server/Items/$itemId/Images/$imageType?maxWidth=$SIZE&maxHeight=$SIZE&quality=90&format=Webp" + (tag?.let { "&tag=$it" } ?: ""), file, itemId, imageType)
            sweepCache()
            file
        } catch (e: NoImage) {
            runCatching { missing.createNewFile() } // full disk: just ask again next time
            throw e
        } catch (e: FileNotFoundException) {
            null
        } finally {
            FETCH_SLOTS.release()
        }
    }

    /**
     * Deletes the least recently used artwork once the directory grows past [MAX_CACHE_BYTES],
     * down to three quarters of it so this doesn't run on every write. Old files are the ones
     * whose covers changed tag, plus letters nobody browses any more.
     */
    private fun sweepCache() {
        if (writesSinceSweep.incrementAndGet() < WRITES_PER_SWEEP) return
        writesSinceSweep.set(0)

        runCatching {
            val files = artworkDir().listFiles()?.toMutableList() ?: return
            var total = files.sumOf { it.length() }
            if (total <= MAX_CACHE_BYTES) return

            files.sortBy { it.lastModified() }
            for (file in files) {
                if (total <= MAX_CACHE_BYTES / 4 * 3) break
                val size = file.length()
                if (file.delete()) total -= size
            }
        }
    }

    /**
     * Up to [MAX_COLLAGE] covers ("<itemId>.<type>.<tag>,…") in one tile: a single cover as is,
     * 2–4 in a 2×2 grid, 5–9 in a 3×3 grid. Falls back to the letter tile when none loads, when
     * [COLLAGE_SLOTS] collages are already being built, or after [COLLAGE_TIMEOUT_S]: this runs
     * on a binder thread the media session shares, so it must never wait long. A collage missing
     * covers for network reasons isn't cached, so the next request retries.
     */
    private fun collage(items: String, letter: String): ParcelFileDescriptor {
        val refs =
            items
                .split(',')
                .take(MAX_COLLAGE)
                .map { it.split('.') }
                .filter { it.size == 3 && ITEM_ID.matches(it[0]) && it[1] in IMAGE_TYPES && TAG.matches(it[2]) }
        if (refs.isEmpty()) return open(letterTile(letter))

        val key = MessageDigest.getInstance("SHA-1").digest(refs.joinToString(",") { it.joinToString(".") }.toByteArray()).joinToString("") { "%02x".format(it) }
        val file = File(artworkDir(), "collage-$key.png")
        if (file.exists()) return open(file)

        if (!COLLAGE_SLOTS.tryAcquire()) return open(letterTile(letter))
        try {
            // null = download failed (retry later); a missing image (404) is simply left out.
            val results =
                COLLAGE_POOL
                    .invokeAll(
                        refs.map { (id, type, tag) -> Callable { runCatching { image(id, type, tag) ?: FAILED }.getOrElse { if (it is NoImage) null else FAILED } } },
                        COLLAGE_TIMEOUT_S,
                        TimeUnit.SECONDS,
                    ).map { if (it.isCancelled) FAILED else it.get() }
            val images = results.filter { it != null && it !== FAILED }.map { it!! }
            if (images.isEmpty()) return open(letterTile(letter))
            if (images.size == 1) return open(images[0])
            return drawCollage(images, file, cacheable = results.none { it === FAILED })
        } finally {
            COLLAGE_SLOTS.release()
        }
    }

    private fun drawCollage(images: List<File>, file: File, cacheable: Boolean): ParcelFileDescriptor {
        val columns = if (images.size <= 4) 2 else 3
        val cell = SIZE / columns
        val bitmap = Bitmap.createBitmap(cell * columns, cell * columns, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        canvas.drawColor(COLLAGE_BACKGROUND)
        val paint = Paint(Paint.FILTER_BITMAP_FLAG)
        images.forEachIndexed { i, image ->
            val cover = decodeAtMost(image, SIZE) ?: return@forEachIndexed
            val side = minOf(cover.width, cover.height)
            val src = Rect((cover.width - side) / 2, (cover.height - side) / 2, (cover.width + side) / 2, (cover.height + side) / 2)
            val x = (i % columns) * cell
            val y = (i / columns) * cell
            canvas.drawBitmap(cover, src, Rect(x, y, x + cell, y + cell), paint)
            cover.recycle()
        }

        val tmp = File.createTempFile(file.name, ".tmp", file.parentFile)
        try {
            tmp.outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
            if (cacheable && (tmp.renameTo(file) || file.exists())) return open(file)
            // Readable after the delete: the descriptor keeps the file alive.
            return open(tmp)
        } finally {
            bitmap.recycle()
            if (tmp.exists()) tmp.delete()
        }
    }

    /** Decodes [file] downsampled until both sides are under 2×[max] px, whatever the server sent. */
    private fun decodeAtMost(file: File, max: Int): Bitmap? {
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(file.path, bounds)
        var sample = 1
        while (bounds.outWidth / (sample * 2) >= max || bounds.outHeight / (sample * 2) >= max) sample *= 2
        return BitmapFactory.decodeFile(file.path, BitmapFactory.Options().apply { inSampleSize = sample })
    }

    private fun open(file: File) = ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)

    /** A square tile with the letter centered, cached per letter. */
    private fun letterTile(letter: String): File {
        val dir = artworkDir()
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
