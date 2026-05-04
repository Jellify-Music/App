import { MaterialTopTabBar, MaterialTopTabBarProps } from '@react-navigation/material-top-tabs'
import React from 'react'
import { XStack, YStack, Paragraph } from 'tamagui'
import Icon from '../Global/components/icon'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import useLibraryStore from '../../stores/library'
import { handleLibraryShuffle } from '../../hooks/player/functions/shuffle'
import { TrackPlayer } from 'react-native-nitro-player'
import { Presets } from 'react-native-pulsar'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import LibraryStackParamList from '@/src/screens/Library/types'
import { ICON_PRESS_STYLES } from '../../configs/style.config'

function LibraryTabBar(props: MaterialTopTabBarProps) {
	const libraryStackNavigation = useNavigation<NativeStackNavigationProp<LibraryStackParamList>>()

	const insets = useSafeAreaInsets()

	const currentTab = props.state.routes[props.state.index].name as
		| 'Tracks'
		| 'Albums'
		| 'Artists'
		| 'Playlists'

	// Subscribe directly to the current tab's filter state for reactivity
	const currentFilters = useLibraryStore((state) => {
		if (currentTab === 'Playlists') return null
		return state.filters[currentTab.toLowerCase() as 'tracks' | 'albums' | 'artists']
	})

	const hasActiveFilters =
		currentFilters &&
		(currentFilters.isFavorites === true ||
			currentFilters.isDownloaded === true ||
			currentFilters.isUnplayed === true ||
			(currentFilters.genreIds && currentFilters.genreIds.length > 0) ||
			currentFilters.yearMin != null ||
			currentFilters.yearMax != null)

	const handleShufflePress = async () => {
		Presets.peck()

		try {
			await handleLibraryShuffle()

			await TrackPlayer.play()
		} catch (error) {
			console.error('Failed to shuffle and play:', error)
		}
	}

	return (
		<YStack marginTop={insets.top}>
			<MaterialTopTabBar {...props} />

			{[''].includes(props.state.routes[props.state.index].name) ? null : (
				<XStack
					alignContent={'flex-start'}
					justifyContent='flex-start'
					paddingHorizontal={'$1'}
					paddingVertical={'$2'}
					gap={'$2'}
				>
					{props.state.routes[props.state.index].name === 'Playlists' && (
						<XStack
							onPress={() => {
								Presets.peck()
								props.navigation.navigate('AddPlaylist')
							}}
							alignItems={'center'}
							justifyContent={'center'}
							{...ICON_PRESS_STYLES}
						>
							<Icon name={'plus-circle-outline'} color={'$primary'} />

							<Paragraph fontWeight={'$6'} color={'$primary'}>
								Create Playlist
							</Paragraph>
						</XStack>
					)}

					{props.state.routes[props.state.index].name === 'Tracks' && (
						<XStack
							onPress={handleShufflePress}
							alignItems={'center'}
							justifyContent={'center'}
							{...ICON_PRESS_STYLES}
						>
							<Icon name={'shuffle'} color={'$borderColor'} />

							<Paragraph fontWeight={'$6'} color={'$borderColor'}>
								All
							</Paragraph>
						</XStack>
					)}

					{props.state.routes[props.state.index].name !== 'Playlists' && (
						<>
							<XStack
								onPress={() => {
									Presets.peck()
									libraryStackNavigation.navigate('SortOptions', {
										currentTab: currentTab as 'Tracks' | 'Albums' | 'Artists',
									})
								}}
								alignItems={'center'}
								justifyContent={'center'}
								{...ICON_PRESS_STYLES}
							>
								<Icon name={'sort'} color={'$borderColor'} />

								<Paragraph fontWeight={'$6'} color={'$borderColor'}>
									Sort
								</Paragraph>
							</XStack>

							<XStack
								onPress={() => {
									Presets.peck()
									libraryStackNavigation.navigate('Filters', {
										currentTab: currentTab as 'Tracks' | 'Albums' | 'Artists',
									})
								}}
								alignItems={'center'}
								justifyContent={'center'}
								{...ICON_PRESS_STYLES}
							>
								<Icon
									name={hasActiveFilters ? 'filter-variant' : 'filter'}
									color={hasActiveFilters ? '$primary' : '$borderColor'}
								/>

								<Paragraph
									fontWeight={'$6'}
									color={hasActiveFilters ? '$primary' : '$borderColor'}
								>
									Filter
								</Paragraph>
							</XStack>
						</>
					)}

					{props.state.routes[props.state.index].name !== 'Playlists' &&
						hasActiveFilters && (
							<XStack
								onPress={() => {
									Presets.peck()
									// Clear filters only for the current tab
									if (currentTab === 'Tracks') {
										useLibraryStore.getState().setTracksFilters({
											isFavorites: undefined,
											isDownloaded: false,
											isUnplayed: false,
											genreIds: undefined,
											yearMin: undefined,
											yearMax: undefined,
										})
									} else if (currentTab === 'Albums') {
										useLibraryStore.getState().setAlbumsFilters({
											isFavorites: undefined,
											yearMin: undefined,
											yearMax: undefined,
										})
									} else if (currentTab === 'Artists') {
										useLibraryStore
											.getState()
											.setArtistsFilters({ isFavorites: undefined })
									}
								}}
								pressStyle={{ opacity: 0.6 }}
								transition='quick'
								alignItems={'center'}
								justifyContent={'center'}
							>
								<Icon name={'filter-remove'} color={'$borderColor'} />

								<Paragraph fontWeight={'$6'} color={'$borderColor'}>
									Clear
								</Paragraph>
							</XStack>
						)}
				</XStack>
			)}
		</YStack>
	)
}

export default LibraryTabBar
