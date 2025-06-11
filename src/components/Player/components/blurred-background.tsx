import { BlurView } from '@react-native-community/blur'
import React from 'react'
import { usePlayerContext } from '../../../providers/Player'
import { useWindowDimensions } from 'tamagui'
import { Platform, useColorScheme } from 'react-native'
import { getImageApi } from '@jellyfin/sdk/lib/utils/api'
import { useJellifyContext } from '../../../providers'
import FastImage from 'react-native-fast-image'

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
						<FastImage
							source={{
								uri: getImageApi(api).getItemImageUrlById(nowPlaying.item.Id!),
							}}
						/>
					</BlurView>
				</>
			)}
		</>
	)
}
