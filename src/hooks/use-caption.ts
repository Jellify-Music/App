import { useQuery } from '@tanstack/react-query'
import { INFO_CAPTIONS } from '../configs/messaging/info'
import { pickRandomItemFromArray } from '../utils/parsing/random'
import { LOADING_CAPTIONS } from '../configs/messaging/loading'
import { QueryAges } from '../constants/durations'

enum CaptionQueryKeys {
	InfoCaption,
	LoadingCaption,
}

export const useInfoCaption = () =>
	useQuery({
		queryKey: [CaptionQueryKeys.InfoCaption],
		queryFn: () => `${pickRandomItemFromArray(INFO_CAPTIONS)}`,
		staleTime: QueryAges.OneHour,
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
