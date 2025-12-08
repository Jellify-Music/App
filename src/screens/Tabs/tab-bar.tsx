import { Miniplayer } from '../../components/Player/mini-player'
import InternetConnectionWatcher from '../../components/Network/internetConnectionWatcher'
import { BottomTabBar, BottomTabBarProps } from '@react-navigation/bottom-tabs'
import useIsMiniPlayerActive from '../../hooks/use-mini-player'
import { useIsFocused } from '@react-navigation/native'

export default function TabBar({ ...props }: BottomTabBarProps): React.JSX.Element {
	const isFocused = useIsFocused()

	const isMiniPlayerActive = useIsMiniPlayerActive()

	return (
		<>
			{isMiniPlayerActive && isFocused && <Miniplayer />}
			<InternetConnectionWatcher />

			<BottomTabBar {...props} />
		</>
	)
}
