import { fetch } from 'react-native-nitro-fetch'
import type { Patron } from '../../../../types/patron'

import { SPECIAL_THANKS_API_ENDPOINT } from '../../../../configs/config'

export default async function fetchSpecialThanks(signal?: AbortSignal): Promise<Patron[]> {
	const response = await fetch(SPECIAL_THANKS_API_ENDPOINT, { signal })
	if (!response.ok) throw new Error(`Request failed with status ${response.status}`)
	return (await response.json()) as Patron[]
}
