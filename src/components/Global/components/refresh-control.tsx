import { useEffect } from 'react'
import { useLoadingCaption } from '../../../hooks/use-caption'
import { RefreshControl as RNRefreshControl } from 'react-native'
import { useTheme } from 'tamagui'

export default function RefreshControl({
	refresh,
	refreshing,
}: {
	refresh: () => void | Promise<unknown>
	refreshing: boolean
}): React.JSX.Element {
	const theme = useTheme()

	const { data: loadingCaption, refetch } = useLoadingCaption()

	useEffect(() => {
		if (!refreshing) refetch()
	}, [refreshing])

	return (
		<RNRefreshControl
			refreshing={refreshing}
			onRefresh={refresh}
			tintColor={theme.primary.val}
			title={refreshing ? loadingCaption : 'Pull to refresh'}
			titleColor={theme.primary.val}
		/>
	)
}
