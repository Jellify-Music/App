import React from 'react'
import { YStack, XStack } from 'tamagui'
import { Text } from '../Global/helpers/text'
import { CheckboxWithLabel } from '../Global/helpers/checkbox-with-label'
import useLibraryStore from '../../stores/library'
import useHapticFeedback from '../../hooks/use-haptic-feedback'
import { FiltersProps } from './types'

export default function Filters({ currentTab }: FiltersProps): React.JSX.Element {
	const { filters, setTracksFilters, setAlbumsFilters, setArtistsFilters } = useLibraryStore()
	const trigger = useHapticFeedback()

	if (!currentTab || currentTab === 'Playlists') {
		return <></>
	}

	const currentFilters = filters[currentTab.toLowerCase() as 'tracks' | 'albums' | 'artists']
	const isFavorites = currentFilters.isFavorites
	const isDownloaded = currentFilters.isDownloaded ?? false

	const handleFavoritesToggle = (checked: boolean | 'indeterminate') => {
		trigger('impactLight')
		const newValue = checked === true ? true : undefined

		if (currentTab === 'Tracks') {
			setTracksFilters({ isFavorites: newValue })
		} else if (currentTab === 'Albums') {
			setAlbumsFilters({ isFavorites: newValue })
		} else if (currentTab === 'Artists') {
			setArtistsFilters({ isFavorites: newValue })
		}
	}

	const handleDownloadedToggle = (checked: boolean | 'indeterminate') => {
		trigger('impactLight')
		if (currentTab === 'Tracks') {
			setTracksFilters({ isDownloaded: checked === true })
		}
	}

	const showDownloadedFilter = currentTab === 'Tracks'

	return (
		<YStack flex={1} padding={'$4'} gap={'$4'}>
			<Text bold fontSize={'$6'} marginBottom={'$2'}>
				Filter Options
			</Text>

			<YStack gap={'$4'}>
				<XStack alignItems='center' justifyContent='space-between'>
					<CheckboxWithLabel
						checked={isFavorites === true}
						onCheckedChange={handleFavoritesToggle}
						label='Favorites'
						size='$5'
					/>
				</XStack>

				{showDownloadedFilter && (
					<XStack alignItems='center' justifyContent='space-between'>
						<CheckboxWithLabel
							checked={isDownloaded}
							onCheckedChange={handleDownloadedToggle}
							label='Downloaded'
							size='$5'
						/>
					</XStack>
				)}
			</YStack>
		</YStack>
	)
}
