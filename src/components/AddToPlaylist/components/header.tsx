import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { XStack, YStack, SizableText } from 'tamagui'
import ItemImage from '../../Global/components/image'
import { Ticker } from '../../Global/utils/Animated/text'
import { getItemName } from '../../../utils/formatting/item-names'

/**
 * Props for the AddToPlaylistHeader component
 */
interface AddToPlaylistHeaderProps {
	source?: BaseItemDto
	tracks: BaseItemDto[]
}

/**
 * Renders the header for the AddToPlaylist component, displaying the source item or the first track along with its artists.
 *
 * @param param0 The props for the AddToPlaylistHeader component, including the source item and the list of tracks.
 *
 * @returns The JSX element representing the header for the AddToPlaylist component.
 */
export default function AddToPlaylistHeader({
	source,
	tracks,
}: AddToPlaylistHeaderProps): React.JSX.Element {
	return (
		(source ?? tracks[0]) && (
			<XStack gap='2' padding='2' boxShadow={'0 2px 8px 0 black75'}>
				<ItemImage
					item={source ?? tracks[0]}
					width={'6'}
					height={'6'}
					imageOptions={{ maxWidth: 150, maxHeight: 150, quality: 90 }}
					elevate
				/>

				<YStack justifyContent='space-evenly'>
					<Ticker>
						<SizableText fontWeight='6' fontSize='4'>
							{getItemName(source ?? tracks[0])}
						</SizableText>
					</Ticker>

					{(source ?? tracks[0])?.ArtistItems && (
						<Ticker>
							<SizableText fontWeight='6' fontSize={'3'}>
								{`${(source ?? tracks[0])!.ArtistItems?.map((artist) => getItemName(artist)).join(', ')}`}
							</SizableText>
						</Ticker>
					)}
				</YStack>
			</XStack>
		)
	)
}
