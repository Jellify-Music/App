import QuickConnect from '../../components/Login/quick-connect'
import { SafeAreaView } from 'react-native-safe-area-context'
import { loginScreenStyles } from './styles'

export default function QuickConnectScreen(): React.JSX.Element {
	return (
		<SafeAreaView style={loginScreenStyles.container} testID='quick_connect_screen'>
			<QuickConnect />
		</SafeAreaView>
	)
}
