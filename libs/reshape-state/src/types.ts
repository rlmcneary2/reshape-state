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
) => [state: T, changed?: boolean];

/**
 * The dispatcher will accept one or more tasks as parameters. Each task is
 * processed in sequence starting with the leftmost parameter. If the task is an
 * `InlineHandler` only that handler will be invoked, the `ActionHandlers` will
 * NOT be invoked as there is no action to pass to them.
 */
export type Dispatcher = (...tasks: (Action | InlineHandler)[]) => void;

/**
 * Returns a state object.
 */
export type GetState<T> = () => T;

/**
 * When passed to the Dispatcher this function will be invoked so state can be updated.
 * @param state Current state.
 * @returns The first element is a state object. The optional second element indicates if the state has changed, defaults to false.
 */
export type InlineHandler<T = any> = (state: T) => [state: T, changed?: boolean];

export type Reshaper<T> = {
  addHandlers: (handlers: ActionHandler<T>[]) => Reshaper<T>;
  addOnChange: (onChange: OnChange<T>) => Reshaper<T>;
  dispatch: Dispatcher;
  removeHandlers: (handlers: ActionHandler<T>[]) => Reshaper<T>;
  removeOnChange: (onChange: OnChange<T>) => Reshaper<T>;
  setGetState: (getter: GetState<T>) => Reshaper<T>;
};

export type OnChange<T> = (state: T) => void;
