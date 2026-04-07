import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { TrackItem } from 'react-native-nitro-player'
import getTrackDto from './track-extra-payload'
import { SlimifiedBaseItemDto } from '@/src/types/JellifyTrack'

export function slimifyDto(dto: BaseItemDto): SlimifiedBaseItemDto {
	return {
		Id: dto.Id,
		Name: dto.Name,
		Album: dto.Album,
		AlbumId: dto.AlbumId,
		ArtistItems: dto.ArtistItems,
		ImageBlurHashes: dto.ImageBlurHashes,
		NormalizationGain: dto.NormalizationGain,
		RunTimeTicks: dto.RunTimeTicks,
		OfficialRating: dto.OfficialRating,
		CustomRating: dto.CustomRating,
		ProductionYear: dto.ProductionYear,
		ImageTags: dto.ImageTags,
		Type: dto.Type,
		AlbumPrimaryImageTag: dto.AlbumPrimaryImageTag,
	}
}

export default function mapTrackToSlimifiedDto(track: TrackItem): SlimifiedBaseItemDto {
	const dto = getTrackDto(track)!

	return {
		Id: dto.Id,
		Name: dto.Name,
		AlbumId: dto.AlbumId,
		ArtistItems: dto.ArtistItems,
		ImageBlurHashes: dto.ImageBlurHashes,
		NormalizationGain: dto.NormalizationGain,
		RunTimeTicks: dto.RunTimeTicks,
		OfficialRating: dto.OfficialRating,
		CustomRating: dto.CustomRating,
		ProductionYear: dto.ProductionYear,
		ImageTags: dto.ImageTags,
		Type: dto.Type,
	}
}
