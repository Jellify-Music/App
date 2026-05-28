import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'

type AlphabeticalPageLetter = string

type AlphabeticalPageParam = {
	page: number
	letter: AlphabeticalPageLetter
}

export type AlphabeticalPage = {
	title: AlphabeticalPageLetter
	data: BaseItemDto[]
}

export default AlphabeticalPageParam
