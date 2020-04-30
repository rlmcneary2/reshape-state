export type Action<T = any> = {
  id: string | number;
  payload?: T;
};

/**
 * Manages changes state through actions. While the ActionHandler is a synchronus function it may have side effects (start asynchronous actions) and invoke "dispatch" to queue up new actions.
 * @param state Current state.
 * @param action The action that may modify state.
 * @param dispatch Allows an action to de dispatched.
 * @returns The first element is a state object. The optional second element indicates if the state has changed, defaults to false.
 */
export type ActionHandler<T, U = any> = (
  state: T,
  action: Action<U>,
  dispatch: Dispatcher
) => [T, boolean?];

export type Dispatcher = (action: Action) => void;

/**
 * Returns a state object.
 */
export type GetState<T> = () => T;

export type OnChange<T> = (state: T) => void;
