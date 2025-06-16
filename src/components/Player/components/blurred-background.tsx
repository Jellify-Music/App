import React, { useMemo } from 'react'
import { usePlayerContext } from '../../../providers/Player'
import { View } from 'tamagui'

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

	return <View />
}
