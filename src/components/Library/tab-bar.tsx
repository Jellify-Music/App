import { MaterialTopTabBar, MaterialTopTabBarProps } from '@react-navigation/material-top-tabs'
import React, { useEffect } from 'react'
import { Square, XStack, YStack } from 'tamagui'
import Icon from '../Global/components/icon'
import { Text } from '../Global/helpers/text'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import useHapticFeedback from '../../hooks/use-haptic-feedback'
import StatusBar from '../Global/helpers/status-bar'
import useLibraryStore from '../../stores/library'
import useTrackSelectionStore from '../../stores/selection/tracks'

function LibraryTabBar(props: MaterialTopTabBarProps) {
	const { isFavorites, setIsFavorites, isDownloaded, setIsDownloaded } = useLibraryStore()
	const { isSelecting, activeContext, beginSelection, endSelection, clearSelection } =
		useTrackSelectionStore()

	const trigger = useHapticFeedback()

	const insets = useSafeAreaInsets()
	const isOnTracksTab = props.state.routes[props.state.index].name === 'Tracks'
	const isTrackSelectionActive = isSelecting && activeContext === 'library-tracks'

	useEffect(() => {
		if (!isOnTracksTab && isTrackSelectionActive) {
			endSelection()
			clearSelection()
		}
	}, [isOnTracksTab, isTrackSelectionActive, endSelection, clearSelection])

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
					{props.state.routes[props.state.index].name === 'Playlists' ? (
						<XStack
							onPress={() => {
								trigger('impactLight')
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
					) : (
						<XStack
							onPress={() => {
								trigger('impactLight')
								setIsFavorites(isFavorites ? undefined : true)
							}}
							pressStyle={{ opacity: 0.6 }}
							animation='quick'
							alignItems={'center'}
							justifyContent={'center'}
						>
							<Icon
								name={isFavorites ? 'heart' : 'heart-outline'}
								color={isFavorites ? '$primary' : '$borderColor'}
							/>

							<Text color={isFavorites ? '$primary' : '$borderColor'}>
								{isFavorites ? 'Favorites' : 'All'}
							</Text>
						</XStack>
					)}

					{isOnTracksTab && (
						<>
							<XStack
								onPress={() => {
									trigger('impactLight')
									setIsDownloaded(!isDownloaded)
								}}
								pressStyle={{ opacity: 0.6 }}
								animation='quick'
								alignItems={'center'}
								justifyContent={'center'}
							>
								<Icon
									name={isDownloaded ? 'download' : 'download-outline'}
									color={isDownloaded ? '$success' : '$borderColor'}
								/>

								<Text color={isDownloaded ? '$success' : '$borderColor'}>
									{isDownloaded ? 'Downloaded' : 'All'}
								</Text>
							</XStack>

							<XStack
								onPress={() => {
									trigger('impactLight')
									if (isTrackSelectionActive) {
										endSelection()
										clearSelection()
									} else {
										beginSelection('library-tracks')
									}
								}}
								pressStyle={{ opacity: 0.6 }}
								animation='quick'
								alignItems={'center'}
								justifyContent={'center'}
							>
								<Icon
									name={
										isTrackSelectionActive
											? 'close-circle-outline'
											: 'checkbox-outline'
									}
									color={isTrackSelectionActive ? '$primary' : '$borderColor'}
								/>

								<Text color={isTrackSelectionActive ? '$primary' : '$borderColor'}>
									{isTrackSelectionActive ? 'Cancel' : 'Select'}
								</Text>
							</XStack>
						</>
					)}
				</XStack>
			)}
		</YStack>
	)
}

export default LibraryTabBar
