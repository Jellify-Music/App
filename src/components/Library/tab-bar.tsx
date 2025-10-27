import { MaterialTopTabBar, MaterialTopTabBarProps } from '@react-navigation/material-top-tabs'
import React from 'react'
import { XStack, YStack } from 'tamagui'
import Icon from '../Global/components/icon'
import { useLibrarySortAndFilterContext } from '../../providers/Library'
import { Text } from '../Global/helpers/text'
import { isUndefined } from 'lodash'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import useHapticFeedback from '../../hooks/use-haptic-feedback'

function LibraryTabBar(props: MaterialTopTabBarProps) {
	const { isFavorites, setIsFavorites, isDownloaded, setIsDownloaded } =
		useLibrarySortAndFilterContext()

	const trigger = useHapticFeedback()

	const insets = useSafeAreaInsets()

	return (
		<YStack paddingTop={insets.top}>
			<MaterialTopTabBar {...props} />

			{[''].includes(props.state.routes[props.state.index].name) ? null : (
				<XStack
					borderColor={'$borderColor'}
					marginTop={'$2'}
					backgroundColor={'$background'}
					alignItems={'center'}
					justifyContent='flex-start'
					paddingHorizontal={'$4'}
					paddingVertical={'$1'}
					gap={'$4'}
					maxWidth={'80%'}
				>
					{props.state.routes[props.state.index].name === 'Playlists' ? (
						<XStack
							onPress={() => {
								trigger('impactLight')
								props.navigation.navigate('AddPlaylist')
							}}
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
								setIsFavorites(!isUndefined(isFavorites) ? undefined : true)
							}}
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

					{props.state.routes[props.state.index].name === 'Tracks' && (
						<XStack
							onPress={() => {
								trigger('impactLight')
								setIsDownloaded(!isDownloaded)
							}}
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
					)}
				</XStack>
			)}
		</YStack>
	)
}

export default LibraryTabBar
