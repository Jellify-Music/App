import i18n from '../../../../i18n'
import { CarPlayListItem, CarPlayListSection } from 'react-native-nitro-player'
import { PAGE_SIZE, titles } from '../constants'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import toTracks, { playableTracks } from './track'
import { opens } from './events'

export async function playableItems(key: string, items: BaseItemDto[]) {
	return playableTracks(key, await toTracks(items))
}

export function byLetter(letter: string) {
	return letter === '#' ? { nameLessThan: 'A' } : { nameStartsWith: letter }
}

// "More" keeps long lists within the car's item limit
export function withMore(
	base: string,
	offset: number,
	items: CarPlayListItem[],
): CarPlayListSection[] {
	if (items.length <= PAGE_SIZE) return [{ items }]
	const more = `${base}@${offset + PAGE_SIZE}`
	return [
		{
			items: [
				...items.slice(0, PAGE_SIZE),
				{
					id: more,
					title: i18n.t('car.more'),
					template: opens(more, titles.get(base) ?? ''),
				},
			],
		},
	]
}
