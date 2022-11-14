import { queue, QueueItemResult } from "./task-queue";
import {
  Action,
  ActionHandler,
  CreateOptions,
  Dispatcher,
  GetState,
  InlineHandler,
  LoopAction,
  OnChange,
  Reshaper
} from "./types";

/**
 * This is the entry function of reshape-state; creates an instance of a
 * Reshaper.
 * @template T The type of the state object.
 * @param options Control the behavior of the reshaper.
 * @returns A Reshaper object.
 */
export function create<T>(options: CreateOptions = {}): Readonly<Reshaper<T>> {
  const { loopUntilSettled = false } = options;
  const addTask = queue();
  let getState: GetState<T>;
  let missingGetStateLogged = false;

  const storeInternal: {
    actionHandlers: Set<ActionHandler<T>>;
    dispatch: Dispatcher<T>;
    onChangeHandlers: Set<OnChange<T>>;
  } = {
    actionHandlers: new Set<ActionHandler<T>>(),
    dispatch: (...tasks: (Action | InlineHandler<T>)[]) => {
      addTask(() => {
        if (!getState) {
          if (!missingGetStateLogged) {
            missingGetStateLogged = true;
            console.error(
              "reshape-state: No GetState function exists; use `setGetState` to provide one. Ignoring this task."
            );
          }

          const bail: QueueItemResult<void> = {
            cancel: () => {
              /* noop */
            },
            result: Promise.resolve({
              error: new Error(
                "No GetState function exists; use `setGetState` to provide one. Ignoring this task."
              )
            })
          };

          return bail;
        } else {
          missingGetStateLogged = false;
        }

        let nextState = getState();
        let stateChanged = false;
        for (const task of tasks) {
          let loopStateChanged = false;
          let action: Action | InlineHandler<T> | LoopAction = task;
          do {
            [nextState, loopStateChanged] = processTask<T>(
              nextState,
              action,
              storeInternal.dispatch,
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
    },
    onChangeHandlers: new Set<OnChange<T>>()
  };

  return Object.freeze({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    dispatch: storeInternal.dispatch,

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
  task: Action | InlineHandler<T> | LoopAction,
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
  result: [state: unknown, changed?: boolean],
  taskType: "ActionHandler" | "InlineHandler"
) {
  if (!result || !Array.isArray(result)) {
    throw Error(`The ${taskType} did not return an array as its result.`);
  }
}
