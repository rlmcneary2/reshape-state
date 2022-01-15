import { queue } from "./task-queue";
import {
  Action,
  ActionHandler,
  CreateOptions,
  Dispatcher,
  GetState,
  InlineHandler,
  OnChange,
  Reshaper
} from "./types";

/**
 * Create a Reshaper that will process state by actions and then provide the new
 * state via the OnChange functions.
 * @param options Properties to control the behavior of the reshaper.
 * @returns A Reshaper object.
 */
export function create<T>(options: CreateOptions = {}): Readonly<Reshaper<T>> {
  const { loopUntilSettled = false } = options;
  const addTask = queue();
  let getState: GetState<T>;
  let missingGetStateLogged = false;

  const storeInternal = {
    actionHandlers: new Set<ActionHandler<T>>(),
    onChangeHandlers: new Set<OnChange<T>>()
  };

  ((storeInternal as any).dispatch as Dispatcher<T>) = function (
    ...tasks: (Action | InlineHandler)[]
  ) {
    addTask(() => {
      if (!getState) {
        if (!missingGetStateLogged) {
          missingGetStateLogged = true;
          console.warn(
            "reshape-state: No GetState function exists; use `setGetState` to provide one. Initial state will be undefined."
          );
        }
      }

      let nextState = getState ? getState() : undefined;
      let stateChanged = false;
      for (const task of tasks) {
        let loopStateChanged = false;
        let action = task;
        do {
          [nextState, loopStateChanged] = processTask<T>(
            nextState,
            action,
            (storeInternal as any).dispatch,
            storeInternal.actionHandlers
          );

          stateChanged = loopStateChanged || stateChanged;
          action = { id: null };
        } while (loopUntilSettled && loopStateChanged);
      }

      if (stateChanged) {
        for (const o of storeInternal.onChangeHandlers) {
          o(nextState);
        }
      }
    });
  };

  return Object.freeze({
    addHandlers: function (handlers: ActionHandler<T>[]) {
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

    addOnChange: function (onChange: OnChange<T>) {
      !storeInternal.onChangeHandlers.has(onChange) &&
        storeInternal.onChangeHandlers.add(onChange);
      return this;
    },

    dispatch: (storeInternal as any).dispatch,

    removeHandlers: function (handlers: ActionHandler<T>[]) {
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

    removeOnChange: function (onChange: OnChange<T>) {
      storeInternal.onChangeHandlers.has(onChange) &&
        storeInternal.onChangeHandlers.delete(onChange);
      return this;
    },

    setGetState: function (getter: GetState<T>) {
      getState = getter;
      return this;
    }
  });
}

function processTask<T>(
  state: T,
  task: Action | InlineHandler,
  dispatch: Dispatcher<T>,
  handlers: Set<ActionHandler<T>>
): [state: T, changed: boolean] {
  let nextState = state;
  let stateChanged = false;
  if (typeof task === "function") {
    const result = task(state);
    validateResult(result, "InlineHandler");

    const [handlerState, changed = false] = result;
    nextState = changed ? handlerState : nextState;
    stateChanged = changed || stateChanged;
  } else {
    for (const h of handlers) {
      const result = h(nextState, task, dispatch);
      validateResult(result, "ActionHandler");

      const [handlerState, changed = false] = result;
      nextState = changed ? handlerState : nextState;
      stateChanged = changed || stateChanged;
    }
  }

  return [nextState, stateChanged];
}

function validateResult(
  result: [state: any, changed?: boolean],
  taskType: "ActionHandler" | "InlineHandler"
) {
  if (!result || !Array.isArray(result)) {
    throw Error(`The ${taskType} did not return an array as its result.`);
  }
}
