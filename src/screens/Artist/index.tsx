import { useLayoutEffect } from 'react'
import { RouteProp, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { ArtistProvider } from '../../providers/Artist'
import FavoriteButton from '../../components/Global/components/favorite-button'
import { BaseStackParamList } from '../types'
import { ArtistTabsNavigation } from './tabs'

export default function ArtistScreen({
	route,
}: {
	route: RouteProp<BaseStackParamList, 'Artist'>
}): React.JSX.Element {
	const { artist } = route.params

	const navigation = useNavigation<NativeStackNavigationProp<BaseStackParamList>>()

	// the header is the stack's, which this screen owns, rather than the tabs' beneath it
	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => <FavoriteButton item={artist} />,
		})
	}, [navigation, artist])

	return (
		<ArtistProvider artist={artist}>
			<ArtistTabsNavigation />
		</ArtistProvider>
	)
}
