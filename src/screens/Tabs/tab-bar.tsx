import { Miniplayer } from '../../components/Player/mini-player'
import InternetConnectionWatcher from '../../components/Network/internetConnectionWatcher'
import { useNowPlaying } from '../../providers/Player/hooks/queries'
import { BottomTabBar, BottomTabBarProps } from '@react-navigation/bottom-tabs'
import useAppActive from '../../hooks/use-app-active'

export default function TabBar({ ...props }: BottomTabBarProps): React.JSX.Element {
	const { data: nowPlaying } = useNowPlaying()

	const appIsActive = useAppActive()

	const showMiniPlayer = nowPlaying && appIsActive

	return (
		<>
			{showMiniPlayer && (
				/* Hide miniplayer if the queue is empty */
				<Miniplayer />
			)}
			<InternetConnectionWatcher />

			<BottomTabBar {...props} />
		</>
	)
}
