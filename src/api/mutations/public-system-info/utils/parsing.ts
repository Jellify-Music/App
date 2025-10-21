import HTTPS, { HTTP } from '../../../../constants/protocols'
import { isUndefined } from 'lodash'

export default function serverAddressContainsProtocol(serverAddress: string | undefined) {
	return (
		!isUndefined(serverAddress) &&
		(serverAddress.includes(HTTP) || serverAddress.includes(HTTPS))
	)
}
