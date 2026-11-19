import AudioSpecs from '../../components/AudioSpecs'
import { AudioSpecsProps } from '../types'

export default function AudioSpecsSheet({ route }: AudioSpecsProps): React.JSX.Element {
	return <AudioSpecs {...route.params} />
}
