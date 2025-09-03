import React from 'react'
import { ArtistAlbumsProps, ArtistEpsProps, ArtistFeaturedOnProps } from './types'
import { useArtistContext } from '../../providers/Artist'
import { Spinner, YStack } from 'tamagui'
import ItemRow from '../Global/components/item-row'
import { Text } from '../Global/helpers/text'
export default function Albums({
	route,
	navigation,
}: ArtistAlbumsProps | ArtistEpsProps | ArtistFeaturedOnProps): React.JSX.Element {
	const { albums, fetchingAlbums, featuredOn, scroll } = useArtistContext()

	return (
		<YStack flex={1}>
			<Text>hello</Text>
			{fetchingAlbums ? (
				<Spinner color={'$primary'} />
			) : (
				albums?.map((album) => (
					<ItemRow item={album} key={album.Id} queueName='' navigation={navigation} />
				))
			)}
		</YStack>
	)
}
