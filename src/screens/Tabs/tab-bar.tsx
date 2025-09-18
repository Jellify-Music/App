import { Miniplayer } from '../../components/Player/mini-player'
import InternetConnectionWatcher from '../../components/Network/internetConnectionWatcher'
import { useNowPlaying } from '../../providers/Player/hooks/queries'
import { BottomTabBar, BottomTabBarProps } from '@react-navigation/bottom-tabs'

export default function TabBar({ ...props }: BottomTabBarProps): React.JSX.Element {
	const { data: nowPlaying } = useNowPlaying()

	return (
		<>
			{nowPlaying && (
				/* Hide miniplayer if the queue is empty */
				<Miniplayer />
			)}
			<InternetConnectionWatcher />

			<BottomTabBar {...props} />
		</>
	)
}
