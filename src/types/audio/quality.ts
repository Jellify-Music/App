import { MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client'

export type AudioBitrate = NonNullable<MediaSourceInfo['Bitrate']>

export interface AudioQuality {
	AudioBitRate: number
	MaxAudioBitDepth: string
}
