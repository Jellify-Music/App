import React from 'react'
import { YStack, XStack, Button } from 'tamagui'
import { Text } from '../Global/helpers/text'
import { CheckboxWithLabel } from '../Global/helpers/checkbox-with-label'
import useLibraryStore from '../../stores/library'
import { triggerHaptic } from '../../hooks/use-haptic-feedback'
import { FiltersProps } from './types'
import Icon from '../Global/components/icon'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../screens/types'

export default function Filters({
	currentTab,
	navigation,
}: FiltersProps & {
	navigation?: NativeStackNavigationProp<RootStackParamList>
}): React.JSX.Element {
	const { filters, setTracksFilters, setAlbumsFilters, setArtistsFilters } = useLibraryStore()
	if (!currentTab || currentTab === 'Playlists') {
		return <></>
	}

	const currentFilters = filters[currentTab.toLowerCase() as 'tracks' | 'albums' | 'artists']
	const isFavorites = currentFilters.isFavorites
	const isDownloaded = currentFilters.isDownloaded ?? false
	const isUnplayed = currentFilters.isUnplayed ?? false
	const selectedGenreIds = currentFilters.genreIds ?? []
	const hasGenresSelected = selectedGenreIds.length > 0
	const yearMin = currentFilters.yearMin
	const yearMax = currentFilters.yearMax
	const hasYearRange = yearMin != null || yearMax != null
	const yearRangeLabel =
		yearMin != null || yearMax != null ? `${yearMin ?? '…'} – ${yearMax ?? '…'}` : null

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

	const isTracksTab = currentTab === 'Tracks'

	const handleGenreSelect = () => {
		triggerHaptic('impactLight')
		navigation?.navigate('GenreSelection')
	}

	const handleYearRangeSelect = () => {
		triggerHaptic('impactLight')
		navigation?.navigate('YearSelection', {
			tab: currentTab === 'Tracks' || currentTab === 'Albums' ? currentTab : 'Tracks',
		})
	}

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

				{isTracksTab && (
					<XStack alignItems='center' justifyContent='space-between'>
						<CheckboxWithLabel
							id='filter-downloaded'
							checked={isDownloaded}
							onCheckedChange={handleDownloadedToggle}
							label='Downloaded'
							size='$6'
							disabled={hasGenresSelected}
						/>
					</XStack>
				)}

				{isTracksTab && (
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

				{isTracksTab && (
					<XStack alignItems='center' justifyContent='space-between' marginTop='$3'>
						<Button
							variant='outlined'
							size='$4'
							onPress={handleGenreSelect}
							pressStyle={{ opacity: 0.6 }}
							animation='quick'
							flex={1}
							justifyContent='space-between'
							disabled={isDownloaded}
						>
							<Text
								color={
									isDownloaded
										? '$borderColor'
										: hasGenresSelected
											? '$primary'
											: '$neutral'
								}
							>
								{`Genres ${hasGenresSelected ? `(${selectedGenreIds.length})` : ''}`}
							</Text>
							<Icon
								name={hasGenresSelected ? 'filter-variant' : 'filter'}
								color={hasGenresSelected ? '$primary' : '$borderColor'}
							/>
						</Button>
					</XStack>
				)}

				{(isTracksTab || currentTab === 'Albums') && (
					<XStack alignItems='center' justifyContent='space-between' marginTop='$4'>
						<Button
							variant='outlined'
							size='$4'
							onPress={handleYearRangeSelect}
							pressStyle={{ opacity: 0.6 }}
							animation='quick'
							flex={1}
							justifyContent='space-between'
							disabled={isTracksTab && isDownloaded}
						>
							<Text
								color={
									isTracksTab && isDownloaded
										? '$borderColor'
										: hasYearRange
											? '$primary'
											: '$neutral'
								}
							>
								{hasYearRange ? `Year range ${yearRangeLabel}` : 'Year range'}
							</Text>
							<Icon
								name={hasYearRange ? 'filter-variant' : 'filter'}
								color={hasYearRange ? '$primary' : '$borderColor'}
							/>
						</Button>
					</XStack>
				)}
			</YStack>
		</YStack>
	)
}
