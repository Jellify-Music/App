import InstantMix from '../../components/InstantMix/component'
import { InstantMixProps } from '../types'
import { InstantMixProvider } from '../../providers/InstantMix'

export default function InstantMixScreen({ route }: InstantMixProps) {
	return (
		<InstantMixProvider item={route.params.item}>
			<InstantMix />
		</InstantMixProvider>
	)
}
