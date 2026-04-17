import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'

enum InstantMixQueryKeys {
	InstantMix = 'INSTANT_MIX',
}

const InstantMixQueryKey = ({ Id }: BaseItemDto) => [InstantMixQueryKeys.InstantMix, Id]

export default InstantMixQueryKey
