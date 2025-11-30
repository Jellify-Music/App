import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'

/**
 * Describes where playback was initiated from.
 * Allows known queue labels (e.g., "Recently Played") as well as dynamic strings like search terms.
 */
export type Queue = BaseItemDto | string
