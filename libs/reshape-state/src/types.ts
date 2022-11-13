/**
 * An object passed to `dispatch` then sequentially to each {@link ActionHandler}.
 * @template P The type of the payload property.
 */
export interface Action<P = any> {
  /**
   * Identifies the action. Handlers use this to determine if they should
   * operate on the action.
   */
  id: string | number;

  /**
   * Data needed by handlers to process the action.
   */
  payload?: P;
}

/**
 * Processes state and makes changes based on `Actions`. While the ActionHandler
 * is a synchronous function it may have side effects (start asynchronous
 * actions) and invoke "dispatch" to queue up new actions.
 * @template T The type of the `state` parameter and the first element in the
 * return tuple.
 * @template P The type of the Action `payload`.
 * @param state Current state.
 * @param action The action dispatched to the handler.
 * @param dispatch Allows an action to de dispatched.
 * @returns A tuple, the first element is an object of type `T`. The optional
 * second element indicates if the state has changed; if not provided it
 * defaults to false.
 */
export interface ActionHandler<T, P = any> {
  (state: T, action: Action<P> | LoopAction<P>, dispatch: Dispatcher<T>): [
    state: T,
    changed?: boolean
  ];
}

/**
 * Options for the {@link create} function.
 */
export interface CreateOptions {
  /**
   * If true then when a task is dispatched all the handlers will be called
   * repeatedly until none of them change the state object. If false each
   * handler is only called once per dispatched task (default).
   */
  loopUntilSettled?: boolean;
}

/**
 * Instances of a Dispatcher accept one or more tasks as parameters. Each task
 * is processed in sequence starting with the leftmost parameter. If a task is
 * an Action it will be passed sequentially to each {@link ActionHandler}. If a
 * task is an InlineHandler that inline handler function will be invoked.
 * @template T The type of the state object passed to each {@link ActionHandler}
 * and {@link InlineHandler}.
 * @param tasks One or more parameters that are an Action or InlineHandler.
 */
export interface Dispatcher<T> {
  (...tasks: (Action | InlineHandler<T>)[]): void;
}

/**
 * Passed to a reshape-state instance. When invoked this function returns the
 * current state object.
 * @template T The type of the state object.
 * @returns The current state object.
 */
export interface GetState<T> {
  (): T;
}

/**
 * When passed to a {@link Dispatcher} this function will be invoked so state
 * can be updated.
 * @template T The type of the state parameter and first element in the return
 * tuple.
 * @param state Current state.
 * @returns A tuple, the first element is an object of type `T`. The optional
 * second element indicates if the state has changed; if not provided it
 * defaults to false.
 */
export interface InlineHandler<T = any> {
  (state: T): [state: T, changed?: boolean];
}

/**
 * An Action object passed to handlers when state has changed and
 * `loopUntilSettled` is true.
 */
export interface LoopAction<T = unknown> extends Omit<Action<T>, "id"> {
  /** Will always be null. */
  id: null;
}

/**
 * A Reshaper is the primary object of reshape-state and is responsible for
 * managing updates to a state object.
 * @template T The type of the state object.
 */
export interface Reshaper<T> {
  /**
   * Add handlers that will be invoked to process a dispatched {@link Action}.
   * @param handlers An array of handlers that will modify state.
   * @returns The Reshaper.
   */
  addHandlers: (handlers: ActionHandler<T>[]) => Reshaper<T>;

  /**
   * Add an onChange callback. Only a single callback can be passed to this
   * function but the function can be invoked multiple times to add multiple
   * callbacks.
   * @param onChange A callback function that will be invoked when state
   * changes.
   * @returns The Reshaper.
   */
  addOnChange: (onChange: OnChange<T>) => Reshaper<T>;

  /**
   * Dispatch one or more {@link Action}s or {@link InlineHandler}s to update
   * state.
   * @template T The type of the state object.
   */
  dispatch: Dispatcher<T>;

  /**
   * Remove an array of handlers.
   * @param handlers Handlers added using {@link addHandlers}.
   * @returns The Reshaper.
   */
  removeHandlers: (handlers: ActionHandler<T>[]) => Reshaper<T>;

  /**
   * Remove an onChange callback.
   * @param onChange The instance of the callback passed to {@link addOnChange}.
   * @returns The Reshaper.
   */
  removeOnChange: (onChange: OnChange<T>) => Reshaper<T>;

  /**
   * Provide a function that returns the current state when invoked. The return
   * value of `getter` will be passed to the handlers.
   * @param getter A function that returns the current state object.
   * @returns The Reshaper.
   */
  setGetState: (getter: GetState<T>) => Reshaper<T>;
}

/**
 * This callback function is invoked to let subscribers know when state changes.
 * @see {@link Reshaper.addOnChange}
 * @template T The type of the state object.
 * @param state The updated state object, after processing by every
 * {@link ActionHandler} and {@link InlineHandler}.
 */
export interface OnChange<T> {
  (state: T): void;
}
