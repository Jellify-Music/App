import React, { useMemo } from 'react'
import { usePlayerContext } from '../../../providers/Player'
import { BlurView } from 'blur-react-native'
import ItemImage from '../../Global/components/image'
import { getToken, useTheme, View } from 'tamagui'
import { useColorScheme } from 'react-native'

export default function BlurredBackground({
	width,
	height,
}: {
	width: number
	height: number
}): React.JSX.Element {
	const { nowPlaying } = usePlayerContext()
	const theme = useTheme()
	const isDarkMode = useColorScheme() === 'dark'

	const blurhash = useMemo(() => {
		return nowPlaying &&
			nowPlaying.item.ImageBlurHashes &&
			nowPlaying.item.ImageBlurHashes.Primary
			? Object.values(nowPlaying.item.ImageBlurHashes.Primary)[0]
			: ''
	}, [nowPlaying])

	return (
		<View flex={1} width={width} height={height}>
			<BlurView
				style={{
					width,
					height,
					position: 'absolute',
					top: 0,
					left: 0,
					bottom: 0,
					right: 0,
				}}
				blurAmount={100}
				blurType={isDarkMode ? 'dark' : 'light'}
			/>

			<ItemImage item={nowPlaying!.item} style={{ width, height }} />
		</View>
	)
}
