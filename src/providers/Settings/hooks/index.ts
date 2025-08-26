import { useQuery } from '@tanstack/react-query'
import { DEVICE_PROFILE_QUERY } from '../constants/queries'
import { StreamingQuality } from '..'

export const useDeviceProfile = (streamingQuality: StreamingQuality) =>
	useQuery(DEVICE_PROFILE_QUERY(streamingQuality))
