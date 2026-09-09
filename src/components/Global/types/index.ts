import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { SectionListData, SectionListRenderItemInfo } from 'react-native'

type LibrarySection = {
	title: string
	data: BaseItemDto[]
}

export type LibrarySectionListRenderItemInfo = SectionListRenderItemInfo<
	BaseItemDto,
	LibrarySection
>

export type LibrarySectionListData = SectionListData<BaseItemDto, LibrarySection>

/**
 * Jumps a library list directly to `letter`, seeding the query cache with the page that starts
 * there instead of paginating through every page in between.
 *
 * Resolves `true` if the cache was seeded and the AZScroller can scroll straight to the top of
 * the results, or `false` to fall back to incremental pagination.
 */
export type JumpToLetter = (letter: string, reverseOrder: boolean) => Promise<boolean>
