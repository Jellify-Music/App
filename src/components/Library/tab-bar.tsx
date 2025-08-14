import { MaterialTopTabBar, MaterialTopTabBarProps } from '@react-navigation/material-top-tabs'
import React from 'react'
import { XStack, YStack } from 'tamagui'
import Icon from '../Global/components/icon'
import { useLibrarySortAndFilterContext } from '../../providers/Library/sorting-filtering'
import { Text } from '../Global/helpers/text'
import { isUndefined } from 'lodash'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { trigger } from 'react-native-haptic-feedback'
import { useSettingsContext } from '../../providers/Settings'

function LibraryTabBar(props: MaterialTopTabBarProps) {
	const { isFavorites, setIsFavorites, isDownloaded, setIsDownloaded } =
		useLibrarySortAndFilterContext()

	const { reducedHaptics } = useSettingsContext()

	const insets = useSafeAreaInsets()

	return (
		<YStack paddingTop={insets.top}>
			<MaterialTopTabBar {...props} />

			{[''].includes(props.state.routes[props.state.index].name) ? null : (
				<XStack
					paddingHorizontal={'$4'}
					borderWidth={'$1'}
					borderColor={'$borderColor'}
					marginTop={'$2'}
					marginHorizontal={'$2'}
					borderRadius={'$4'}
					backgroundColor={'$background'}
					alignItems={'center'}
					justifyContent='flex-end'
				>
					{props.state.routes[props.state.index].name === 'Playlists' ? (
						<XStack
							flex={1}
							onPress={() => {
								if (!reducedHaptics) trigger('impactLight')
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
							flex={1}
							onPress={() => {
								if (!reducedHaptics) trigger('impactLight')
								setIsFavorites(!isUndefined(isFavorites) ? undefined : true)
							}}
							alignItems={'center'}
							justifyContent={'center'}
						>
							<Icon
								name={isFavorites ? 'heart' : 'heart-outline'}
								color={isFavorites ? '$secondary' : '$borderColor'}
							/>

							<Text color={isFavorites ? '$secondary' : '$borderColor'}>
								{isFavorites ? 'Favorites' : 'All'}
							</Text>
						</XStack>
					)}

					{props.state.routes[props.state.index].name === 'Tracks' && (
						<XStack
							flex={1}
							onPress={() => {
								if (!reducedHaptics) trigger('impactLight')
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
