import React, { useMemo } from 'react'
import { usePlayerContext } from '../../../providers/Player'
import { Blurhash } from 'react-native-blurhash'

export default function BlurredBackground({
	width,
	height,
}: {
	width: number
	height: number
}): React.JSX.Element {
	const { nowPlaying } = usePlayerContext()

	const blurhash = useMemo(() => {
		return nowPlaying &&
			nowPlaying.item.ImageBlurHashes &&
			nowPlaying.item.ImageBlurHashes.Primary
			? Object.values(nowPlaying.item.ImageBlurHashes.Primary)[0]
			: ''
	}, [nowPlaying])

	return (
		<Blurhash
			blurhash={blurhash}
			decodeHeight={32}
			decodeWidth={32}
			resizeMode='stretch'
			style={{
				flex: 1,
				width,
				height,
				opacity: 0.5,
			}}
		/>
	)
}
