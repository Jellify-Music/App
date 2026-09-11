import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { YStack, SizableText, RadioGroup } from 'tamagui'
import { RadioGroupItemWithLabel } from '../Global/helpers/radio-group-item-with-label'
import { ItemSortByProps } from '@/src/screens/Library/types'
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client'
import { useLibraryArtistsStore } from '../../stores/library/artist'
import { useState } from 'react'
import { ArtistsSortBy as ArtistsSortByType } from '../../types/sorting/artist'
import ArtistsSortByConfig from '../../configs/sorting/artist'
import { SORTBY_TEXT } from '../../configs/messaging/sort-by'

export default function ItemSortBy({ route }: ItemSortByProps): React.JSX.Element | null {
	const { type } = route.params

	switch (type) {
		case BaseItemKind.MusicArtist:
			return MusicArtist()
		case BaseItemKind.MusicAlbum:
			return null
		case BaseItemKind.Audio:
			return null
		default:
			return null
	}
}

function MusicArtist() {
	const { sortBy, setSortBy } = useLibraryArtistsStore()

	const { bottom } = useSafeAreaInsets()

	const onSortByChange = (value: string) => setSortBy(value as ArtistsSortByType)

	return (
		<YStack padding={'$4'} marginBottom={bottom} gap={'$4'}>
			<YStack gap={'$2'}>
				<SizableText fontSize={'$6'} fontWeight={'$6'} marginBottom={'$2'}>
					Sort By
				</SizableText>
				<RadioGroup value={sortBy} onValueChange={onSortByChange}>
					<YStack gap={'$2'}>
						{Object.values(ArtistsSortByConfig).map((option) => (
							<RadioGroupItemWithLabel
								key={option}
								size={'$4'}
								value={option}
								label={SORTBY_TEXT[option]}
							/>
						))}
					</YStack>
				</RadioGroup>
			</YStack>
		</YStack>
	)
}
