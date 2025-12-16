import Miniplayer from '../../components/Player/mini-player'
import InternetConnectionWatcher from '../../components/Network/internetConnectionWatcher'
import { BottomTabBar, BottomTabBarProps } from '@react-navigation/bottom-tabs'
import useIsMiniPlayerActive from '../../hooks/use-mini-player'

export default function TabBar({ ...props }: BottomTabBarProps): React.JSX.Element {
	const isMiniPlayerActive = useIsMiniPlayerActive()

	return (
		<>
			{isMiniPlayerActive && <Miniplayer />}
			<InternetConnectionWatcher />

			<BottomTabBar {...props} />
		</>
	)
}
