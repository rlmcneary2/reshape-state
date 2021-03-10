/**
 * An object that is dispatched.
 */
export interface Action<P = any> {
  /**
   * Identifies the action. Handlers use this to determine if they should operate on the action.
   */
  id: string | number;

  /**
   * The data needed by handlers to process the action.
   */
  payload?: P;
}

/**
 * Manages changes state through actions. While the ActionHandler is a synchronus function it may have side effects (start asynchronous actions) and invoke "dispatch" to queue up new actions.
 * @param state Current state.
 * @param action The action that may modify state.
 * @param dispatch Allows an action to de dispatched.
 * @returns The first element is a state object. The optional second element indicates if the state has changed, defaults to false.
 */
export interface ActionHandler<T, P = any> {
  (state: T, action: Action<P>, dispatch: Dispatcher<T>): [
    state: T,
    changed?: boolean
  ];
}

/**
 * Options for the `create` function.
 */
export interface CreateOptions {
  /**
   * If true then when a task is dispatched all the handlers will be called
   * repeatedly until none of them change the state object. If false each
   * handler is only called once per dispatched task (default)
   */
  loopUntilSettled?: boolean;
}

/**
 * The dispatcher will accept one or more tasks as parameters. Each task is
 * processed in sequence starting with the leftmost parameter. If the task is an
 * `InlineHandler` only that handler will be invoked, the `ActionHandlers` will
 * NOT be invoked as there is no action to pass to them.
 * @param tasks One or more parameters that are an `Action` or `InlineHandler`.
 */
export interface Dispatcher<T> {
  (...tasks: (Action | InlineHandler<T>)[]): void;
}

/**
 * Returns a state object.
 * @returns The current state object.
 */
export interface GetState<T> {
  (): T;
}

/**
 * When passed to the Dispatcher this function will be invoked so state can be updated.
 * @param state Current state.
 * @returns The first element is a state object. The optional second element indicates if the state has changed, defaults to false.
 */
export interface InlineHandler<T = any> {
  (state: T): [state: T, changed?: boolean];
}

export interface Reshaper<T> {
  /**
   * Add handlers that will be invoked to process a dispatched action.
   * @param handlers An array of handlers that will modify state.
   * @returns The Reshaper.
   */
  addHandlers: (handlers: ActionHandler<T>[]) => Reshaper<T>;

  /**
   * Add an onChange callback. Only a single callback can be passed to this function but the function can be invoked multiple times to add multiple callbacks.
   * @param onChange A callback function that will be invoked when state changes.
   * @returns The Reshaper.
   */
  addOnChange: (onChange: OnChange<T>) => Reshaper<T>;

  /**
   * Dispatch an action to update state.
   */
  dispatch: Dispatcher<T>;

  /**
   * Remove an array of handlers.
   * @param handlers Handlers added using `addHandlers`.
   * @returns The Reshaper.
   */
  removeHandlers: (handlers: ActionHandler<T>[]) => Reshaper<T>;

  /**
   * Remove an onChange callback.
   * @param onChange The instance of the callback passed to `addOnChange`.
   * @returns The Reshaper.
   */
  removeOnChange: (onChange: OnChange<T>) => Reshaper<T>;

  /**
   * Get the current state. The return value of `getter` will be passed to the handlers.
   * @param getter A function that returns the current state object.
   * @returns The Reshaper.
   */
  setGetState: (getter: GetState<T>) => Reshaper<T>;
}

/**
 * This callback function is invoked when state changes.
 * @param state The next state.
 */
export interface OnChange<T> {
  (state: T): void;
}
