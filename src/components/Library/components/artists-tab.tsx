import React from 'react'
import { useNavigation } from '@react-navigation/native'
import Artists from '../../Artists/component'
import { useLibraryContext } from '../../../providers/Library'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { StackParamList } from '../../types'

function ArtistsTab(): React.JSX.Element {
	const { artistsInfiniteQuery, artistPageParams } = useLibraryContext()

	const navigation = useNavigation<NativeStackNavigationProp<StackParamList>>()

	return (
		<Artists
			artistsInfiniteQuery={artistsInfiniteQuery}
			navigation={navigation}
			showAlphabeticalSelector={true}
			artistPageParams={artistPageParams}
		/>
	)
}

export default ArtistsTab
