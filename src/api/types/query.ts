import { QueryKey, UseQueryOptions } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'

export type BaseItemDtoQueryOptions = UseQueryOptions<BaseItemDto, Error, BaseItemDto, QueryKey>
