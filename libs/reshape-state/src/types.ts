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

/**
 * The dispatcher will accept one or more actions as parameters. Each action is processed in sequence starting with the leftmost parameter.
 */
export type Dispatcher = (...actions: Action[]) => void;

/**
 * Returns a state object.
 */
export type GetState<T> = () => T;

export type Reshaper<T> = {
  addHandlers: (handlers: ActionHandler<T>[]) => Reshaper<T>;
  addOnChange: (onChange: OnChange<T>) => Reshaper<T>;
  dispatch: Dispatcher;
  removeHandlers: (handlers: ActionHandler<T>[]) => Reshaper<T>;
  removeOnChange: (onChange: OnChange<T>) => Reshaper<T>;
  setGetState: (getter: GetState<T>) => Reshaper<T>;
};

export type OnChange<T> = (state: T) => void;
