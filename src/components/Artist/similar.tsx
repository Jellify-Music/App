import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '../../screens/types'
import { useNavigation } from '@react-navigation/native'
import { useArtistContext } from '../../providers/Artist'
import { ActivityIndicator } from 'react-native'
import { SizableText, YStack } from 'tamagui'
import ItemRow from '../Global/components/item-row'
import React from 'react'
import { Freeze } from 'react-freeze'
import List from '../Global/components/Lists/utils'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { LegendListRenderItemProps } from '@legendapp/list/react-native'

export default function SimilarArtists(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<BaseStackParamList>>()
	const { artist, similarArtists, fetchingSimilarArtists, fetchingAlbums, albums } =
		useArtistContext()

	const renderItem = ({ item: artist }: LegendListRenderItemProps<BaseItemDto>) => (
		<ItemRow
			item={artist}
			onPress={() => {
				navigation.push('Artist', {
					artist,
				})
			}}
		/>
	)

	return (
		<Freeze freeze={fetchingAlbums && !albums}>
			<YStack flex={1} margin={'2'}>
				<SizableText
					size={'3'}
					fontWeight='6'
				>{`Similar to ${artist.Name ?? 'Unknown Artist'}`}</SizableText>

				<List
					data={similarArtists?.slice(0, 5)}
					renderItem={renderItem}
					ListEmptyComponent={
						<ListEmptyComponent fetchingSimilarArtists={fetchingSimilarArtists} />
					}
				/>
			</YStack>
		</Freeze>
	)
}

interface ListEmptyComponentProps {
	fetchingSimilarArtists: boolean
}

function ListEmptyComponent({ fetchingSimilarArtists }: ListEmptyComponentProps) {
	return fetchingSimilarArtists ? (
		<ActivityIndicator />
	) : (
		<SizableText fontSize='3' color={'neutral'} justify={'center'} textAlign='center'>
			No similar artists
		</SizableText>
	)
}
