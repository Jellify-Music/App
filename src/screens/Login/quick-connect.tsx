import QuickConnect from '../../components/Login/components/quick-connect'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function QuickConnectScreen(): React.JSX.Element {
	return (
		<SafeAreaView style={{ flex: 1 }} testID='quick_connect_screen'>
			<QuickConnect />
		</SafeAreaView>
	)
}
