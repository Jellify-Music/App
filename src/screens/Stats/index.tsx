import AudioSpecs from '../../components/AudioSpecs'
import { AudioSpecsProps } from '../types'

export default function AudioSpecsSheet({ route, navigation }: AudioSpecsProps): React.JSX.Element {
	return <AudioSpecs navigation={navigation} {...route.params} />
}
