import { useMutation } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { cacheService } from '../../cache/service'

/**
 * Explicit user downloads are pins in the smart cache: fetched immediately
 * and never auto-evicted. The cache service owns URL resolution, in-flight
 * dedup (via the ledger state machine), and failure handling.
 */
const useDownloadTracks = () =>
	useMutation({
		mutationFn: (items: BaseItemDto[]) => cacheService.pinTracks(items),
	})

export const useDeleteDownloads = () => {
	const deleteDownloads = useMutation({
		// The service removes ledger entries, deletes files, and updates the
		// downloads query cache per track as each eviction lands
		mutationFn: (itemIds: string[]) => cacheService.removeTracks(itemIds),
	})

	return {
		mutate: deleteDownloads.mutate,
		mutateAsync: deleteDownloads.mutateAsync,
		isPending: deleteDownloads.isPending,
	}
}

export default useDownloadTracks
