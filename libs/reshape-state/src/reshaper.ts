import { queue } from "./task-queue";
import {
  Action,
  ActionHandler,
  Dispatcher,
  GetState,
  OnChange,
  Reshaper
} from "./types";

/**
 * Create a Reshaper that will process state by actions and then provide the new
 * state via the OnChange functions.
 * @param getState Returns the state to be updated by the ActionHandlers.
 * @returns A Reshaper object.
 */
export function create<T>(): Readonly<Reshaper<T>> {
  const addTask = queue<void>();
  let getState: GetState<T>;

  const storeInternal = {
    actionHandlers: new Set<ActionHandler<T>>(),
    onChangeHandlers: new Set<OnChange<T>>()
  };

  ((storeInternal as any).dispatch as Dispatcher) = function(
    ...actions: Action[]
  ) {
    addTask(() => {
      let nextState = getState ? getState() : undefined;
      let stateChanged = false;
      for (const action of actions) {
        for (const h of storeInternal.actionHandlers) {
          const result = h(nextState, action, (storeInternal as any).dispatch);

          if (!result || !Array.isArray(result)) {
            throw Error(
              "The ActionHandler did not return an array as its result."
            );
          }

          const [handlerState, changed = false] = result;
          nextState = changed ? handlerState : nextState;
          stateChanged = changed || stateChanged;
        }
      }

      if (stateChanged) {
        for (const o of storeInternal.onChangeHandlers) {
          o(nextState);
        }
      }
    });
  };

  return Object.freeze({
    addHandlers: function(handlers: ActionHandler<T>[]) {
      handlers.forEach(
        h =>
          !storeInternal.actionHandlers.has(h) &&
          storeInternal.actionHandlers.add(h)
      );
      // console.log(
      //   "addHandlers: actionHandlers=",
      //   storeInternal.actionHandlers.size
      // );
      return this;
    },

    addOnChange: function(onChange: OnChange<T>) {
      !storeInternal.onChangeHandlers.has(onChange) &&
        storeInternal.onChangeHandlers.add(onChange);
      return this;
    },

    dispatch: (storeInternal as any).dispatch,

    removeHandlers: function(handlers: ActionHandler<T>[]) {
      handlers.forEach(
        h =>
          storeInternal.actionHandlers.has(h) &&
          storeInternal.actionHandlers.delete(h)
      );
      // console.log(
      //   "removeHandlers: actionHandlers=",
      //   storeInternal.actionHandlers.size
      // );
      return this;
    },

    removeOnChange: function(onChange: OnChange<T>) {
      storeInternal.onChangeHandlers.has(onChange) &&
        storeInternal.onChangeHandlers.delete(onChange);
      return this;
    },

    setGetState: function(getter: GetState<T>) {
      getState = getter;
      return this;
    }
  });
}
