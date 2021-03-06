# reshape-state

A small state management library. Use a reshaper to manage acquiring data for a
state object from multiple asynchronous sources.

An [example
application](https://codesandbox.io/s/reshape-state-0617h?file=/src/swapi/character-reshaper.ts)
that uses reshape-state is available at
[codesandbox.io](https://codesandbox.io/s/reshape-state-0617h?file=/src/swapi/character-reshaper.ts).

## Install

```bash
yarn add reshape-state
```

## Usage

### Create

Create a reshaper that will manage state change actions, manipulating state, and
notifying subscribers when it changes.

```ts
import { create } from "reshape-state";

const reshaper = create<State>();
```

### Listen for changes

Add an OnChange callback to be notified when state changes.

```ts
reshaper.addOnChange(state => console.log("state changed=", state));
```

### Dispatch actions

When state needs to be changed use dispatch with one or more tasks as
parameters. Any Action tasks have one required property `id` which can be a
string or number; the optional `payload` contains information used to update
state. [Inline handlers can also be dispatched](#dispatch-inline-handlers).

```ts
reshaper.dispatch({ id: "name", payload: "Alice" }, { id: "age", payload: 30 });
```

### Update state

Add handler functions to change state.

```ts
reshaper.addHandlers([
  (state, action) => {
    if (action.id === "name") {
      state.name = action.payload;
      return [state, true];
    }

    return [state];
  },
  (state, action) => {
    if (action.id === "family-name") {
      state.familyName = action.payload;
      return [state, true];
    }

    return [state];
  },
]);
```

The handler functions must be synchronous and return at least a state object but
they can start asynchronous code and dispatch a task when they finish (i.e they
can have "side-effects"). In fact handlers don't have to react to an action,
they can do something based on the current shape of the state. In the example
below once state contains a `name` the address associated with that name will be
fetched. The idea is that changing one piece of state can cause another one to
be updated without requiring an intermediate action.

```ts
reshaper.addHandlers([
  (state, _, dispatch) => {
    if (state.name && !state.address) {
      fetch(`${address_url}?name=${state.name}`).then(response =>
        dispatch({ id: "address", payload: response })
      );
    }

    return [state];
  },
  (state, action) => {
    if (action.id === "address") {
      state.address = action.payload;
      return [state, true];
    }

    return [state];
  },
]);
```

You may have noticed state can be mutated - or not - it's up to you. State
change is indicated by the optional second element in the return array not by
object equality. If the second element is not provided the default is that state
has not changed.

### Dispatch inline handlers

Typically after starting asynchronous code in a handler the convention is to
dispatch another Action which will inform all handlers of the asynchronous
code's completion and one or more of the handlers will use the action to update
state. Sometimes there is no no need to inform all the handlers about the
asynchronous result but simply to update state with the result. In this case an
`InlineHandler` can be dispatched which will be invoked with the current state.
Like other handler functions it must synchronously return a state object and an
indication if the state has changed.

```ts
reshaper.addHandlers([
  (state, action, dispatch) => {
    if (action.id === "address") {
      fetch(`${address_url}?name=${state.name}`).then(response =>
        // Dispatch an InlineHandler that will update state with the
        // asynchronous result when it is invoked.
        dispatch(currentState => {
          currentState.address = response;
          return [currentState, true];
        });
      );
    }

    return [state];
  },
]);
```

### Changing state without an action

There may be situations where you'd like a change to state to trigger further
changes to state in a different handler. This could be accomplished using a
"chain" of dispatched actions however if it's possible to determine what updates
to state are needed based on the current state you can configure the reshaper to
iterate over all the handlers you provide until state does not change.

To enable this mode pass the `loopUntilSettled` property as an option to the
`create` function.

```ts
import { create } from "reshape-state";

const reshaper = create<State>({ loopUntilSettled: true });
```

Now when an action is dispatched, or an inline handler is invoked, that results
in a change to state every handler will be called again with a special action.
This action will have its `id` set to null and will not include a payload.

For example this would be useful if you knew that after fetching data from a
remote service and updating state that subsequent requests to another service
must be made for more information.

### Remove listeners and handlers

If the reshaper is no longer needed the OnChange callback and handlers should be
removed.

```ts
reshaper.removeHandlers(handlers);
reshaper.removeOnChange(handleChange);
```
