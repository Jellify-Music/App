import { BlurView } from '@react-native-community/blur'
import React from 'react'
import { usePlayerContext } from '../../../providers/Player'
import { useWindowDimensions, View, ZStack } from 'tamagui'
import { Platform, useColorScheme } from 'react-native'
import { useJellifyContext } from '../../../providers'
import ItemImage from '../../Global/components/image'

export default function BlurredBackground(): React.JSX.Element {
	const { api } = useJellifyContext()
	const { nowPlaying } = usePlayerContext()
	const { width, height } = useWindowDimensions()

	const isDarkMode = useColorScheme() === 'dark'

	const blurAmount = Platform.OS === 'android' ? 32 : 64

	return (
		<>
			{api && nowPlaying && (
				<>
					<BlurView
						blurType={isDarkMode ? 'dark' : 'light'}
						style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
						blurAmount={blurAmount}
					>
						<ZStack fullscreen>
							<ItemImage item={nowPlaying.item} width={width} height={height} />
							<View
								style={{
									position: 'absolute',
									backgroundColor: 'rgba(0, 0, 0, 0.75)',
									width: width,
									height: height,
								}}
							/>
						</ZStack>
					</BlurView>
				</>
			)}
		</>
	)
}
