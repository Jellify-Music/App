import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { Card } from 'tamagui'
import ItemImage from '../image'

interface ItemCardBackgroundProps {
	item: BaseItemDto
	squared?: boolean
}

export default function ItemCardBackground({ item, squared }: ItemCardBackgroundProps) {
	return (
		<Card.Background height='100%' width='100%'>
			<ItemImage
				item={item}
				circular={!squared}
				width={'100%'}
				height={'100%'}
				imageOptions={{ maxWidth: 250, maxHeight: 250, quality: 100 }}
			/>
		</Card.Background>
	)
}
