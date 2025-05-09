import { MaterialTopTabBar, MaterialTopTabBarProps } from '@react-navigation/material-top-tabs'
import React, { useEffect } from 'react'
import { Button, getToken, Separator, XStack, YStack } from 'tamagui'
import Icon from '../Global/helpers/icon'
import { useLibrarySortAndFilterContext } from '../../providers/Library/sorting-filtering'
import { Text } from '../Global/helpers/text'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import Animated from 'react-native-reanimated'

export default function LibraryTabBar(props: MaterialTopTabBarProps) {
	useEffect(() => {
		console.debug(`LibraryTabBar:`, props.state.routes[props.state.index].name)
	}, [props])

	const { sortDescending, setSortDescending, isFavorites, setIsFavorites } =
		useLibrarySortAndFilterContext()
	return (
		<YStack>
			<MaterialTopTabBar {...props} />

			<XStack
				paddingHorizontal={'$4'}
				paddingVertical={'$3'}
				borderWidth={'$1'}
				borderColor={'$purpleGray'}
				marginTop={'$2'}
				marginHorizontal={'$2'}
				borderRadius={'$4'}
				backgroundColor={'$background'}
				alignItems={'center'}
				shadowRadius={'$4'}
				shadowColor={'$purpleDark'}
				shadowOffset={{ width: 0, height: -20 }}
				shadowOpacity={0.25}
				elevation={5}
			>
				<Animated.View entering={FadeIn} exiting={FadeOut}>
					{props.state.routes[props.state.index].name === 'Playlists' ? (
						<XStack
							flex={1}
							onPress={() => props.navigation.navigate('AddPlaylist')}
							alignItems={'center'}
							justifyContent={'center'}
						>
							<Icon
								name={'plus-circle-outline'}
								color={getToken('$color.telemagenta')}
							/>

							<Text color={'$telemagenta'}>Create Playlist</Text>
						</XStack>
					) : (
						<XStack
							flex={1}
							onPress={() => setIsFavorites(!isFavorites)}
							alignItems={'center'}
							justifyContent={'center'}
						>
							<Icon
								name={isFavorites ? 'heart' : 'heart-outline'}
								color={
									isFavorites
										? getToken('$color.telemagenta')
										: getToken('$color.purpleGray')
								}
							/>

							<Text
								color={
									isFavorites
										? getToken('$color.telemagenta')
										: getToken('$color.purpleGray')
								}
							>
								{isFavorites ? 'Favorites' : 'All'}
							</Text>
						</XStack>
					)}
				</Animated.View>

				<Separator vertical />

				<XStack
					flex={1}
					onPress={() => setSortDescending(!sortDescending)}
					alignItems={'center'}
					justifyContent={'center'}
				>
					<Icon
						name={
							sortDescending
								? 'sort-alphabetical-descending'
								: 'sort-alphabetical-ascending'
						}
						color={
							sortDescending
								? getToken('$color.success')
								: getToken('$color.purpleGray')
						}
					/>

					<Text
						color={
							sortDescending
								? getToken('$color.success')
								: getToken('$color.purpleGray')
						}
					>
						{sortDescending ? 'Descending' : 'Ascending'}
					</Text>
				</XStack>
			</XStack>
		</YStack>
	)
}
