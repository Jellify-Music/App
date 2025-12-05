import { Miniplayer } from '../../components/Player/mini-player'
import InternetConnectionWatcher from '../../components/Network/internetConnectionWatcher'
import useIsMiniPlayerActive from '../../hooks/use-mini-player'
import { useIsFocused } from '@react-navigation/native'
import { YStack } from 'tamagui'

export default function TabBar(): React.JSX.Element {
	const isFocused = useIsFocused()

	const isMiniPlayerActive = useIsMiniPlayerActive()

	return (
		<YStack position='absolute'>
			{isMiniPlayerActive && isFocused && <Miniplayer />}
			<InternetConnectionWatcher />
		</YStack>
	)
}
