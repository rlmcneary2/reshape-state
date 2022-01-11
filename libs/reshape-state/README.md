# reshape-state

A small state management library. Use a reshaper to manage acquiring data for a
state object from multiple asynchronous sources.

An [example
application](https://codesandbox.io/s/reshape-state-0617h?file=/src/swapi/character-reshaper.ts)
that uses reshape-state is available at
[codesandbox.io](https://codesandbox.io/s/reshape-state-0617h?file=/src/swapi/character-reshaper.ts).

- [Install](#install)
- [Usage](#usage)
  - [Create a reshaper](#create)
  - [Listen for state changes](#listen-for-state-changes)
  - [Dispatch actions to handlers](#dispatch-actions-to-handlers)
  - [Update state with handler functions](#update-state-with-handler-functions)
  - [Dispatch inline handlers](#dispatch-inline-handlers)
  - [Changing state without an action](#changing-state-without-an-action)
  - [Remove listeners and handlers](#remove-listeners-and-handlers)
- [Tips & Tricks](#tips-and-tricks)
  - [Create handler functions using a factory function](#create-handler-functions-using-a-factory-function)

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

### Listen for state changes

Add an OnChange callback to be notified when state changes.

```ts
reshaper.addOnChange(state => console.log("state changed=", state));
```

### Dispatch actions to handlers

When state needs to be changed use dispatch with one or more tasks as
parameters. Any Action tasks have one required property `id` which can be a
string or number; the optional `payload` contains information used to update
state. [Inline handlers can also be dispatched](#dispatch-inline-handlers).

```ts
reshaper.dispatch({ id: "name", payload: "Alice" }, { id: "age", payload: 30 });
```

### Update state with handler functions

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

## Tips

### Create handler functions using a factory function

There are several reasons for using a factory function:
  - Move handlers into separate, domain specific module files.
  - Create a scope for data that is only needed by, and private to, the handler functions.

The reshaper's `addHandlers` function accepts an array of handlers so your factory function must return an array. Eventually you will probably want to pass data to your handlers that they need while they are processing state, or you may need to define variables for the handlers that are only needed by the handlers. During development there may be a variety of variables that change based on the environment your code is deployed to, like "dev," "staging," or "production" so a fairly common pattern I use looks like the following example:

```ts
/**
 * auth-handlers.ts
 */

// This exported function can be called to generate an array of handler
// functions to pass to the reshaper.
export function createAuthHandlers(protocol: "http" | "https", domain: string, port?: number){
  // Parts of the service URL that the application needs to talk to may change,
  // so they are passed to the handlers as arguments to the factory function.
  const serviceUrl = new URL(`${protocol}://${domain}${port ? `:${port}` : ""}`);

  // We'll use this flag to prevent multiple asynchronous requests to read the
  // user from being started. Since this variable is only needed by the
  // `readUser` function we create it inside the factory function.
  let readUserStatus: "active" | "inactive" = "inactive";

  const readUser: ActionHandler<State, User> = (state, action, dispatch) => {
    if (action.type !== "read-user"){
      return [state];
    }

    // If we're already in a read operation the do not start another one.
    if (readUserState === "active"){
      return [state];
    }

    // Not currently reading the user, set the flag so we know not to start
    // another user read.
    readUserStatus = "active";

    fetch(serviceUrl)
      .then(response => {
        // If none of our other handlers need to know that the read is complete
        // then an inline handler can be used to simplify updating state.
        dispatch(inlineState => [{...inlineState, userResponse: response}, true]);

        // Now we're ready to process another request for user data so update
        // the flag's value.
        readUserStatus = "inactive";
      });

    return [state];
  };

  // Return an array of ActionHandlers.
  return [readUser];
}

/**
 * auth.ts
 * The file that creates the reshaper.
 */

// Import the factory function
import { create } from "reshape-state";
import { createAuthHandlers } from "./auth-handlers.ts";

// Create the reshaper then invoke the factory function from auth-handlers.ts
// to generate the handlers.
const reshaper = create<State>();
reshaper.addHandlers(createAuthHandlers(process.env.protocol, process.env.domain, +process.env.port));
```

This pattern can be extended so that handlers for specific business functions or
domains can be organized in different files.

```ts
/**
 * app.ts
 * The file that creates the reshaper.
 */

// Import the factory function
import { create } from "reshape-state";
import { createAuthHandlers } from "./auth-handlers.ts";
import { createMenuHandlers } from "./menu-handlers.ts";
import { createOrderHandlers } from "./order-handlers.ts";

// Here the results of multiple handler factory functions are being passed to the reshaper.
const reshaper = create<State>();
reshaper.addHandlers([
  ...createAuthHandlers(process.env.auth_protocol, process.env.auth_domain, +process.env.auth_port),
  ...createMenuHandlers(process.env.protocol, process.env.domain, +process.env.port),
  ...createOrderHandlers(process.env.protocol, process.env.domain, +process.env.port)
]);
```
