import { getItemName } from '../../../utils/formatting/item-names'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { XStack, YStack, SizableText } from 'tamagui'
import { Ticker } from '../utils/Animated/text'
import ItemImage from './image'

interface ModalHeaderProps {
	item: BaseItemDto
}

export default function ModalHeader({ item }: ModalHeaderProps) {
	return (
		<XStack gap='2' padding='3' boxShadow={'0 6px 6px 0 black25'} marginBottom='2'>
			<ItemImage
				item={item}
				width={'6'}
				height={'6'}
				imageOptions={{ maxWidth: 250, maxHeight: 250, quality: 90 }}
				elevate
			/>

			<YStack justifyContent='space-evenly'>
				<Ticker>
					<SizableText fontWeight='6' fontSize='4'>
						{getItemName(item)}
					</SizableText>
				</Ticker>

				{item?.ArtistItems && (
					<Ticker>
						<SizableText fontWeight='6' fontSize={'3'}>
							{getArtistNames(item)}
						</SizableText>
					</Ticker>
				)}
			</YStack>
		</XStack>
	)
}

function getArtistNames(item: BaseItemDto) {
	const artists = item.ArtistItems ?? []

	if (artists.length > 2) {
		return (
			artists
				.slice(0, 2)
				.map((artist) => getItemName(artist))
				.join(', ') + '...'
		)
	}

	return artists.map((artist) => getItemName(artist)).join(', ') ?? ''
}
