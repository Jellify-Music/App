import { useJellifyContext } from '../../../providers'
import { usePlayerContext } from '../../../providers/Player'
import { useQueueContext } from '../../../providers/Player/queue'
import { useWindowDimensions, View } from 'tamagui'

export default function PlayerArtwork() {
	const { api } = useJellifyContext()

	const { nowPlaying } = usePlayerContext()

	const { width } = useWindowDimensions()

	return <View></View>
}
