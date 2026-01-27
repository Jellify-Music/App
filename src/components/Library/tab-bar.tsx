import { MaterialTopTabBar, MaterialTopTabBarProps } from '@react-navigation/material-top-tabs'
import React, { useEffect } from 'react'
import { Square, XStack, YStack } from 'tamagui'
import Icon from '../Global/components/icon'
import { Text } from '../Global/helpers/text'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { triggerHaptic } from '../../hooks/use-haptic-feedback'
import StatusBar from '../Global/helpers/status-bar'
import useLibraryStore from '../../stores/library'
import { handleShuffle } from '../../hooks/player/functions/shuffle'
import { usePlayerQueueStore } from '../../stores/player/queue'
import TrackPlayer from 'react-native-track-player'
import navigationRef from '../../../navigation'

function LibraryTabBar(props: MaterialTopTabBarProps) {
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
		(currentFilters.isFavorites === true || currentFilters.isDownloaded === true)

	const handleShufflePress = async () => {
		triggerHaptic('impactLight')

		// Set queueRef to 'Library' so handleShuffle knows to fetch random tracks
		usePlayerQueueStore.getState().setQueueRef('Library')

		// Call handleShuffle to create and start the shuffled playlist
		try {
			await handleShuffle(false) // Don't keep current track

			// Start playback - TrackPlayer.play() will handle the state check internally
			await TrackPlayer.play()
		} catch (error) {
			console.error('Failed to shuffle and play:', error)
		}
	}

	return (
		<YStack>
			<Square height={insets.top} backgroundColor={'$primary'} />
			<StatusBar invertColors />
			<MaterialTopTabBar {...props} />

			{[''].includes(props.state.routes[props.state.index].name) ? null : (
				<XStack
					borderColor={'$borderColor'}
					alignContent={'flex-start'}
					justifyContent='flex-start'
					paddingHorizontal={'$1'}
					paddingVertical={'$2'}
					gap={'$2'}
					maxWidth={'80%'}
				>
					{props.state.routes[props.state.index].name === 'Playlists' && (
						<XStack
							onPress={() => {
								triggerHaptic('impactLight')
								props.navigation.navigate('AddPlaylist')
							}}
							pressStyle={{ opacity: 0.6 }}
							animation='quick'
							alignItems={'center'}
							justifyContent={'center'}
						>
							<Icon name={'plus-circle-outline'} color={'$primary'} />

							<Text color={'$primary'}>Create Playlist</Text>
						</XStack>
					)}

					{props.state.routes[props.state.index].name === 'Tracks' && (
						<XStack
							onPress={handleShufflePress}
							pressStyle={{ opacity: 0.6 }}
							animation='quick'
							alignItems={'center'}
							justifyContent={'center'}
						>
							<Icon name={'shuffle'} color={'$borderColor'} />

							<Text color={'$borderColor'}>All</Text>
						</XStack>
					)}

					{props.state.routes[props.state.index].name !== 'Playlists' && (
						<XStack
							onPress={() => {
								triggerHaptic('impactLight')
								if (navigationRef.isReady()) {
									navigationRef.navigate('Filters', {
										currentTab: currentTab as 'Tracks' | 'Albums' | 'Artists',
									})
								}
							}}
							pressStyle={{ opacity: 0.6 }}
							animation='quick'
							alignItems={'center'}
							justifyContent={'center'}
						>
							<Icon
								name={hasActiveFilters ? 'filter-variant' : 'filter'}
								color={hasActiveFilters ? '$primary' : '$borderColor'}
							/>

							<Text color={hasActiveFilters ? '$primary' : '$borderColor'}>
								Filter
							</Text>
						</XStack>
					)}

					{props.state.routes[props.state.index].name !== 'Playlists' &&
						hasActiveFilters && (
							<XStack
								onPress={() => {
									triggerHaptic('impactLight')
									// Clear filters only for the current tab
									if (currentTab === 'Tracks') {
										useLibraryStore.getState().setTracksFilters({
											isFavorites: undefined,
											isDownloaded: false,
										})
									} else if (currentTab === 'Albums') {
										useLibraryStore
											.getState()
											.setAlbumsFilters({ isFavorites: undefined })
									} else if (currentTab === 'Artists') {
										useLibraryStore
											.getState()
											.setArtistsFilters({ isFavorites: undefined })
									}
								}}
								pressStyle={{ opacity: 0.6 }}
								animation='quick'
								alignItems={'center'}
								justifyContent={'center'}
							>
								<Icon name={'filter-remove'} color={'$borderColor'} />

								<Text color={'$borderColor'}>Clear</Text>
							</XStack>
						)}
				</XStack>
			)}
		</YStack>
	)
}

export default LibraryTabBar
