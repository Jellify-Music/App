import React from 'react'
import { YStack, XStack } from 'tamagui'
import { Text } from '../Global/helpers/text'
import { CheckboxWithLabel } from '../Global/helpers/checkbox-with-label'
import useLibraryStore from '../../stores/library'
import { triggerHaptic } from '../../hooks/use-haptic-feedback'
import { FiltersProps } from './types'

export default function Filters({ currentTab }: FiltersProps): React.JSX.Element {
	const { filters, setTracksFilters, setAlbumsFilters, setArtistsFilters } = useLibraryStore()
	if (!currentTab || currentTab === 'Playlists') {
		return <></>
	}

	const currentFilters = filters[currentTab.toLowerCase() as 'tracks' | 'albums' | 'artists']
	const isFavorites = currentFilters.isFavorites
	const isDownloaded = currentFilters.isDownloaded ?? false
	const isUnplayed = currentFilters.isUnplayed ?? false

	const handleFavoritesToggle = (checked: boolean | 'indeterminate') => {
		triggerHaptic('impactLight')
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
		triggerHaptic('impactLight')
		if (currentTab === 'Tracks') {
			const isDownloadedChecked = checked === true
			setTracksFilters({
				isDownloaded: isDownloadedChecked,
				// Unselect unplayed when downloaded is selected
				isUnplayed: undefined,
			})
		}
	}

	const showDownloadedFilter = currentTab === 'Tracks'
	const showUnplayedFilter = currentTab === 'Tracks'

	const handleUnplayedToggle = (checked: boolean | 'indeterminate') => {
		triggerHaptic('impactLight')
		if (currentTab === 'Tracks') {
			const isUnplayedChecked = checked === true
			setTracksFilters({
				isUnplayed: isUnplayedChecked,
				// Unselect downloaded when unplayed is selected
				isDownloaded: false,
			})
		}
	}

	return (
		<YStack flex={1} padding={'$4'} gap={'$1'}>
			<Text bold fontSize={'$6'} marginBottom={'$2'}>
				Filter Options
			</Text>

			<YStack>
				<XStack alignItems='center' justifyContent='space-between'>
					<CheckboxWithLabel
						id='filter-favorites'
						checked={isFavorites === true}
						onCheckedChange={handleFavoritesToggle}
						label='Favorites'
						size='$6'
					/>
				</XStack>

				{showDownloadedFilter && (
					<XStack alignItems='center' justifyContent='space-between'>
						<CheckboxWithLabel
							id='filter-downloaded'
							checked={isDownloaded}
							onCheckedChange={handleDownloadedToggle}
							label='Downloaded'
							size='$6'
						/>
					</XStack>
				)}

				{showUnplayedFilter && (
					<XStack alignItems='center' justifyContent='space-between'>
						<CheckboxWithLabel
							id='filter-unplayed'
							checked={isUnplayed}
							onCheckedChange={handleUnplayedToggle}
							label='Unplayed'
							size='$6'
						/>
					</XStack>
				)}
			</YStack>
		</YStack>
	)
}
