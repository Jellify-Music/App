import { StackParamList } from '../../components/types'
import { StackNavigationProp } from '@react-navigation/stack'
import AccountTab from '../../components/Settings/components/account-tab'

export default function AccountDetailsScreen({
	navigation,
}: {
	navigation: StackNavigationProp<StackParamList>
}): React.JSX.Element {
	return <AccountTab />
}
