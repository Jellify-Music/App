export interface JellifyServer {
	url: string
	address: string
	name: string
	version: string
	startUpComplete: boolean
	allowSelfSignedCerts?: boolean
}
