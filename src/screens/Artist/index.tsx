import { RouteProp } from '@react-navigation/native'
import { YStack } from 'tamagui'
import { ArtistProvider } from '../../providers/Artist'
import { ArtistScrollProvider } from '../../components/Artist/scroll'
import ArtistTopBar from '../../components/Artist/top-bar'
import { BaseStackParamList } from '../types'
import { ArtistTabsNavigation } from './tabs'

export default function ArtistScreen({
	route,
}: {
	route: RouteProp<BaseStackParamList, 'Artist'>
}): React.JSX.Element {
	const { artist } = route.params

	return (
		<ArtistProvider artist={artist}>
			<ArtistScrollProvider>
				<YStack flex={1}>
					<ArtistTabsNavigation />

					{/* The stack's header is off so the image can run to the top of the screen; the bar stays put over it */}
					<ArtistTopBar />
				</YStack>
			</ArtistScrollProvider>
		</ArtistProvider>
	)
}
