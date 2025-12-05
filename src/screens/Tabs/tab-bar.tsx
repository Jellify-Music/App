import { Miniplayer } from '../../components/Player/mini-player'
import InternetConnectionWatcher from '../../components/Network/internetConnectionWatcher'
import useIsMiniPlayerActive from '../../hooks/use-mini-player'
import { useIsFocused } from '@react-navigation/native'

export default function TabBar(): React.JSX.Element {
	const isFocused = useIsFocused()

	const isMiniPlayerActive = useIsMiniPlayerActive()

	return (
		<>
			{isMiniPlayerActive && isFocused && <Miniplayer />}
			<InternetConnectionWatcher />
		</>
	)
}
