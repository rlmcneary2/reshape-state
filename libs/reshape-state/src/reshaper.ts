import { queue } from "./task-queue";
import { GetState, ActionHandler, OnChange, Dispatcher, Action } from "./types";

/**
 * Create a Reshaper that will process state by actions and then provide the new state via the OnChange functions.
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

  (storeInternal as any).dispatch = function(action: Action) {
    console.log("dispatch: action=", action);
    addTask(() => {
      let nextState = getState();
      let stateChanged = false;
      for (const h of storeInternal.actionHandlers) {
        const [handlerState, changed = false] = h(
          nextState,
          action,
          (storeInternal as any).dispatch
        );
        nextState = changed ? handlerState : nextState;
        stateChanged = changed || stateChanged;
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

export type Reshaper<T> = {
  addHandlers: (handlers: ActionHandler<T>[]) => Reshaper<T>;
  addOnChange: (onChange: OnChange<T>) => Reshaper<T>;
  dispatch: Dispatcher;
  removeHandlers: (handlers: ActionHandler<T>[]) => Reshaper<T>;
  removeOnChange: (onChange: OnChange<T>) => Reshaper<T>;
  setGetState: (getter: GetState<T>) => Reshaper<T>;
};
