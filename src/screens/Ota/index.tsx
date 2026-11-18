import Ota from '../../components/Ota'
import { OtaProps } from '../types'

export default function OtaScreen({ route }: OtaProps): React.JSX.Element {
	return <Ota pullRequest={route.params?.pullRequest} />
}
