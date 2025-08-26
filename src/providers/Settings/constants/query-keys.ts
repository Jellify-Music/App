import { DownloadQuality, StreamingQuality } from '..'
import SettingsQueryKey from '../enums/query-keys'

export const DEVICE_PROFILE_QUERY_KEY = (streamingQuality: StreamingQuality) => [
	SettingsQueryKey.DeviceProfile,
	streamingQuality,
]
