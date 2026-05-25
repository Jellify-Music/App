import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import uuid from 'react-native-uuid'

export default function ItemKeyExtractor(item: BaseItemDto | string | number) {
	return typeof item === 'object' ? (item.Id ?? uuid.v4.toString()) : uuid.v4.toString()
}
