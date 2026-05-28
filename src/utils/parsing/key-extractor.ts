import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import uuid from 'react-native-uuid'

export default function ItemKeyExtractor({ Id, Type }: BaseItemDto, index: number): string {
	return `${index}-${Type ?? 'item'}-${Id ?? uuid.v4()}`
}
