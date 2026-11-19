/**
 * Represents the possible return types of an event handler.
 * Can be customized with a generic type parameter to represent different return types,
 * but defaults to void if no type parameter is provided.
 *
 * @param T The type of the event handler's return value. Defaults to void.
 */
export type EventHandlerResult<T = void> = T | Promise<T>

/**
 * Represents an event handler function.
 * The function can return a value of type {@link EventHandlerResult<T>}.
 *
 * @param T The type of the event handler's return value. Defaults to void.
 * @param P A tuple of the event handler's parameter types. Defaults to no parameters.
 */
export type EventHandler<T = void, P extends unknown[] = []> = (
	...params: P
) => EventHandlerResult<T>
