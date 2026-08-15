import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { QueuingType } from '../../enums/queuing-type'

export interface QueuingRequest {
	song: BaseItemDto
	queuingType: QueuingType
	atIndex?: number
}
