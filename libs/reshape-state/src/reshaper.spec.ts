import { create } from "./reshaper";
import { Action, ActionHandler } from "./types";

describe("reshaper", () => {
  it("creates a reshaper", async () => {
    const reshaper = create<TestState>();
    reshaper.setGetState(() => ({}));

    const handler = jest.fn<MockHandlerResult, MockHandlerArgs>(
      (state, action) => [{ ...state, ...action.payload }, true]
    );
    reshaper.addHandlers([handler as ActionHandler<TestState>]);

    const handleChange = jest.fn();
    reshaper.addOnChange(handleChange);

    const wait = new Promise<void>(resolve => {
      reshaper.addOnChange(() => {
        resolve();
      });
    });

    reshaper.dispatch({ id: "update" });
    await wait;

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith({});
  });

  it("no state change - no onChange", async () => {
    const reshaper = create<TestState>();

    const state = {};
    const getState = jest.fn(() => state);
    reshaper.setGetState(getState);

    const handler = jest.fn<MockHandlerResult, MockHandlerArgs>(state => [
      state
    ]);
    reshaper.addHandlers([handler as ActionHandler<TestState>]);

    const handleChange = jest.fn();
    reshaper.addOnChange(handleChange);

    const wait = new Promise<void>(resolve => {
      reshaper.addHandlers([
        () => {
          setTimeout(() => resolve(), 1);
          return [state];
        }
      ]);
    });

    reshaper.dispatch({ id: "update" });
    await wait;

    expect(getState).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledTimes(0);
  });

  it("modifies state", async () => {
    const reshaper = create<TestState>();

    const initialState = { foo: "bar" };
    const getState = jest.fn(() => initialState);
    reshaper.setGetState(getState);

    const handler = jest.fn<MockHandlerResult, MockHandlerArgs>(
      (state, action) => [{ ...state, ...action.payload }, true]
    );
    reshaper.addHandlers([handler as ActionHandler<TestState>]);

    const handleChange = jest.fn();
    reshaper.addOnChange(handleChange);

    const wait = new Promise<void>(resolve => {
      reshaper.addOnChange(() => {
        resolve();
      });
    });

    const payload = { fiz: "baz" };
    reshaper.dispatch({ id: "update", payload });

    await wait;

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith({ fiz: "baz", foo: "bar" });
  });

  it("accepts multiple actions", async () => {
    const reshaper = create<TestState>();

    const initialState = { foo: "bar" };
    const getState = jest.fn(() => initialState);
    reshaper.setGetState(getState);

    const handler = jest.fn<MockHandlerResult, MockHandlerArgs>(
      (state, action) => [{ ...state, ...action.payload }, true]
    );
    reshaper.addHandlers([handler as ActionHandler<TestState>]);

    const handleChange = jest.fn();
    reshaper.addOnChange(handleChange);

    const wait = new Promise<void>(resolve => {
      reshaper.addOnChange(() => {
        resolve();
      });
    });

    reshaper.dispatch(
      { id: "update", payload: { fiz: "baz" } },
      { id: "update", payload: { param: "two" } }
    );

    await wait;

    expect(handler).toHaveBeenCalledTimes(2);
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith({
      fiz: "baz",
      foo: "bar",
      param: "two"
    });
  });

  it("accepts inline handlers", async () => {
    const reshaper = create<TestState>();

    const initialState = { foo: "bar" };
    const getState = jest.fn(() => initialState);
    reshaper.setGetState(getState);

    const handler = jest.fn<MockHandlerResult, MockHandlerArgs>(
      (state, action) => [{ ...state, ...action.payload }, true]
    );
    reshaper.addHandlers([handler as ActionHandler<TestState>]);

    const handleChange = jest.fn();
    reshaper.addOnChange(handleChange);

    const wait = new Promise<void>(resolve => {
      reshaper.addOnChange(() => {
        resolve();
      });
    });

    const inlineHandler = jest.fn<MockHandlerResult, [TestState]>(state => {
      return [{ ...state, fiz: "baz" }, true];
    });
    reshaper.dispatch(inlineHandler);

    await wait;

    expect(handler).toHaveBeenCalledTimes(0);
    expect(inlineHandler).toHaveBeenCalledTimes(1);
    expect(inlineHandler).toHaveBeenCalledWith(initialState);
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith({
      fiz: "baz",
      foo: "bar"
    });
  });

  it("loops until state settles", async () => {
    const reshaper = create<unknown>({
      loopUntilSettled: true
    }).setGetState(() => "fubar");

    const handler = jest
      .fn()
      .mockReturnValueOnce(["foo", true])
      .mockReturnValueOnce(["foo"]);
    const handler2 = jest
      .fn()
      .mockReturnValueOnce(["bar"])
      .mockReturnValueOnce(["bar"]);
    reshaper.addHandlers([handler, handler2]);

    let resolve: () => void;
    const wait = new Promise<void>(r => (resolve = r));

    const handleChange = jest.fn(() => resolve());
    reshaper.addOnChange(handleChange);

    const action = { id: "test", payload: "payload" };
    reshaper.dispatch(action);

    await wait;

    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenNthCalledWith(
      1,
      "fubar",
      action,
      expect.anything()
    );
    expect(handler).toHaveBeenNthCalledWith(
      2,
      "foo",
      { id: null },
      expect.anything()
    );

    expect(handler2).toHaveBeenCalledTimes(2);
    expect(handler2).toHaveBeenNthCalledWith(
      1,
      "foo",
      action,
      expect.anything()
    );
    expect(handler2).toHaveBeenNthCalledWith(
      2,
      "foo",
      { id: null },
      expect.anything()
    );

    expect(handleChange).toHaveBeenCalledTimes(1);
  });
});

type MockHandlerArgs = [TestState, Action<Record<string, unknown>>];

type MockHandlerResult = [TestState, boolean?];

type TestState = Record<string, unknown>;
