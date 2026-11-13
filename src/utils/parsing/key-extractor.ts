import { ParsedLyricLine } from '../../types/Lyrics'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import uuid from 'react-native-uuid'

/**
 * Keys an item by its identity and index, ensuring a unique key even if the same item appears multiple times.
 *
 * @param item The item to extract the key from
 * @param index The index of the item in the list
 *
 * @returns A unique key for the item based on its identity and index
 */
export function ItemKeyExtractor(item: BaseItemDto | string | number, index: number) {
	return `${typeof item === 'object' && item !== null && 'Id' in item ? item.Id : uuid.v4()}-${index}`
}

/**
 * Keys an item by its identity alone, so its key survives a reorder.
 * Required for layout animations - an index-based key remounts the item instead of moving it.
 * Only use for lists that can't contain the same item twice.
 *
 * @param item The item to extract the key from
 *
 * @returns A unique key for the item based on its identity alone
 */
export function ItemIdKeyExtractor(item: BaseItemDto | string | number) {
	return typeof item === 'object' && item !== null ? (item.Id ?? uuid.v4()) : `${item}`
}

/**
 * Keys a lyric line by its index and start time, ensuring a unique key for each line.
 *
 * @param item The lyric line to extract the key from
 * @param index The index of the lyric line in the list
 *
 * @returns A unique key for the lyric line based on its index and start time
 */
export function LyricKeyExtractor(item: ParsedLyricLine, index: number) {
	return `lyric-${index}-${item.startTime}`
}
