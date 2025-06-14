import React, { useEffect, useMemo } from 'react'
import { usePlayerContext } from '../../../providers/Player'
import { useWindowDimensions } from 'tamagui'
import { useColorScheme } from 'react-native'
import { useJellifyContext } from '../../../providers'
import { Blurhash } from 'react-native-blurhash'

export default function BlurredBackground({
	width,
	height,
}: {
	width: number
	height: number
}): React.JSX.Element {
	const { api } = useJellifyContext()
	const { nowPlaying } = usePlayerContext()

	const isDarkMode = useColorScheme() === 'dark'

	const blurhash = useMemo(() => {
		return nowPlaying &&
			nowPlaying.item.ImageBlurHashes &&
			nowPlaying.item.ImageBlurHashes.Primary
			? Object.values(nowPlaying.item.ImageBlurHashes.Primary)[0]
			: ''
	}, [nowPlaying])

	return (
		<>
			{api && nowPlaying && (
				<Blurhash
					blurhash={blurhash}
					decodeHeight={32}
					decodeWidth={32}
					resizeMode='stretch'
					style={{
						width,
						height,
					}}
				/>
			)}
		</>
	)
}
