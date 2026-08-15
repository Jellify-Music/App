import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import uuid from 'react-native-uuid'

export function ItemKeyExtractor(item: BaseItemDto | string | number, index: number) {
	return `${typeof item === 'object' && item !== null && 'Id' in item ? item.Id : uuid.v4()}-${index}`
}
