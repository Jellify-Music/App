import { fetch } from 'react-native-nitro-fetch'
import type { Patron } from '../../../../types/patron'

import { PATRON_API_ENDPOINT } from '../../../../configs/config'

export default async function fetchPatrons(signal?: AbortSignal): Promise<Patron[]> {
	const response = await fetch(PATRON_API_ENDPOINT, { signal })
	return parsePatronsResponse(response)
}

async function parsePatronsResponse(response: globalThis.Response): Promise<Patron[]> {
	if (!response.ok) throw new Error(`Request failed with status ${response.status}`)
	return (await response.json()) as Patron[]
}
