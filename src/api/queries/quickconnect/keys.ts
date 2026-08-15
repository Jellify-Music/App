enum QuickConnectQueryKeys {
	STATE = 'QUICK_CONNECT_STATE',
}

export const QuickConnectQueryKey = (secret: string) => [QuickConnectQueryKeys.STATE, secret]
