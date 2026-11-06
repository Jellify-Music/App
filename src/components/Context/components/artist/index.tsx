import { BaseItemDto, ImageType } from '@jellyfin/sdk/lib/generated-client'
import { View } from 'tamagui'
import goToScreenFromContextSheet from '../../utils/navigation'
import { getItemName } from '../../../../utils/formatting/item-names'
import { useArtist } from '../../../../api/queries/artist'
import { ArtistMenuRowsProps, ViewArtistMenuRowProps } from './types'
import ContextMenuRow from '..'

export default function ArtistMenuRows({
	artistIds,
	stackNavigation,
}: ArtistMenuRowsProps): React.JSX.Element {
	return (
		<View>
			{artistIds.map((id) => (
				<ViewArtistMenuRow artistId={id} key={id} stackNavigation={stackNavigation} />
			))}
		</View>
	)
}

function ViewArtistMenuRow({
	artistId,
	stackNavigation,
}: ViewArtistMenuRowProps): React.JSX.Element | null {
	const { data: artist } = useArtist(artistId)

	const goToArtist = (artist: BaseItemDto) => {
		if (stackNavigation) stackNavigation.navigate('Artist', { artist })
		else goToScreenFromContextSheet('Artist', { artist })
	}

	return artist ? (
		<ContextMenuRow
			imageProp={{ imageType: ImageType.Primary, item: artist, circular: true }}
			label={`Go to ${getItemName(artist)}`}
			onPress={() => goToArtist(artist)}
		/>
	) : null
}
