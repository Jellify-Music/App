import { BaseItemDto, MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client'

interface StatsMenuRowProps {
	item: BaseItemDto
	streamingMediaSourceInfo?: MediaSourceInfo
	downloadedMediaSourceInfo?: MediaSourceInfo
}

export default StatsMenuRowProps
