import { StackParamList } from '../../components/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import AccountTab from '../../components/Settings/components/account-tab'

export default function AccountDetailsScreen({
	navigation,
}: {
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	return <AccountTab />
}
