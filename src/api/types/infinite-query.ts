import { UseInfiniteQueryOptions, QueryKey } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'

export type BaseItemDtoInfiniteQueryOptions = UseInfiniteQueryOptions<
	BaseItemDto[],
	Error,
	BaseItemDto[],
	QueryKey,
	number
>
