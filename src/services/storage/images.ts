import TurboImage from 'react-native-turbo-image'
import { captureError, LoggingContext } from '../../utils/logging'

/**
 * Clears TurboImage's in-memory image cache.
 *
 * The on-disk cache is left intact, so images are decoded again from disk
 * rather than downloaded again.
 */
export function clearImageMemoryCache(): void {
	TurboImage.clearMemoryCache().catch((error) =>
		captureError(error, LoggingContext.ImageCache, 'Failed to clear image memory cache'),
	)
}

/**
 * Clears both the in-memory and on-disk TurboImage caches.
 *
 * Used when the user signs out, since cached artwork belongs to the previous
 * server and would otherwise linger until the native LRU caches evict it.
 */
export function clearImageCache(): void {
	clearImageMemoryCache()

	TurboImage.clearDiskCache().catch((error) =>
		captureError(error, LoggingContext.ImageCache, 'Failed to clear image disk cache'),
	)
}
