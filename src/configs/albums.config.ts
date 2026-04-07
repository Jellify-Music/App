import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { convertRunTimeTicksToSeconds } from '../utils/mapping/ticks-to-seconds'
import AlbumRuntimeMinutes from '../enums/album-runtime-minutes'

export const filterForSingles = ({ RunTimeTicks }: BaseItemDto) => {
	return convertRunTimeTicksToSeconds(RunTimeTicks ?? 0) <= AlbumRuntimeMinutes.Single * 60
}

export const filterForEPs = ({ RunTimeTicks }: BaseItemDto) => {
	return (
		convertRunTimeTicksToSeconds(RunTimeTicks ?? 0) > AlbumRuntimeMinutes.Single * 60 &&
		convertRunTimeTicksToSeconds(RunTimeTicks ?? 0) <= AlbumRuntimeMinutes.EP * 60
	)
}

export const filterForAlbums = ({ RunTimeTicks }: BaseItemDto) => {
	return convertRunTimeTicksToSeconds(RunTimeTicks ?? 0) > AlbumRuntimeMinutes.EP * 60
}

export const filterForUnknown = ({ RunTimeTicks }: BaseItemDto) => {
	return typeof RunTimeTicks !== 'number'
}
