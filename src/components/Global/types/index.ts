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
