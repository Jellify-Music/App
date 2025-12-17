import { useQuery } from '@tanstack/react-query'
import { INFO_CAPTIONS } from '../configs/info.config'
import { ONE_HOUR } from '../constants/query-client'
import { pickRandomItemFromArray } from '../utils/random'
import { LOADING_CAPTIONS } from '../configs/loading.config'

enum CaptionQueryKeys {
	InfoCaption,
	LoadingCaption,
}

export const useInfoCaption = () =>
	useQuery({
		queryKey: [CaptionQueryKeys.InfoCaption],
		queryFn: () => `${pickRandomItemFromArray(INFO_CAPTIONS)}`,
		staleTime: ONE_HOUR,
		initialData: 'Live and in stereo',
		refetchOnMount: 'always',
		refetchOnWindowFocus: 'always',
	})

export const useLoadingCaption = () =>
	useQuery({
		queryKey: [CaptionQueryKeys.LoadingCaption],
		queryFn: () => `${pickRandomItemFromArray(LOADING_CAPTIONS)}`,
		staleTime: 0,
		initialData: 'Reticulating splines',
		refetchOnMount: 'always',
		refetchOnWindowFocus: 'always',
	})
