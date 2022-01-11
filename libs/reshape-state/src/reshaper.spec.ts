import { create } from "./reshaper";
import { ActionHandler } from "./types";

describe("reshaper", () => {
  it("creates a reshaper", async () => {
    const reshaper = create<any>();

    const handler = jest.fn(() => [true, true]);
    reshaper.addHandlers([handler as any]);

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
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it("no state change - no onChange", async () => {
    const reshaper = create<any>();

    const state = {};
    const getState = jest.fn(() => state);
    reshaper.setGetState(getState);

    const handler = jest.fn(() => [state]);
    reshaper.addHandlers([handler as any]);

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
    const reshaper = create<any>();

    const initialState = { foo: "bar" };
    const getState = jest.fn(() => initialState);
    reshaper.setGetState(getState);

    const handler = jest.fn((state, action) => [
      { ...state, ...action.payload },
      true
    ]);
    reshaper.addHandlers([handler as any]);

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
    const reshaper = create<any>();

    const initialState = { foo: "bar" };
    const getState = jest.fn(() => initialState);
    reshaper.setGetState(getState);

    const handler = jest.fn((state, action) => [
      { ...state, ...action.payload },
      true
    ]);
    reshaper.addHandlers([handler as any]);

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
    const reshaper = create<any>();

    const initialState = { foo: "bar" };
    const getState = jest.fn(() => initialState);
    reshaper.setGetState(getState);

    const handler = jest.fn((state, action) => [
      { ...state, ...action.payload },
      true
    ]);
    reshaper.addHandlers([handler as any]);

    const handleChange = jest.fn();
    reshaper.addOnChange(handleChange);

    const wait = new Promise<void>(resolve => {
      reshaper.addOnChange(() => {
        resolve();
      });
    });

    const inlineHandler = jest.fn(state => [{ ...state, fiz: "baz" }, true]);

    reshaper.dispatch(inlineHandler as any);

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
    const reshaper = create<any>({
      loopUntilSettled: true
    }).setGetState(() => "fubar");

    const handler = (jest
      .fn()
      .mockReturnValueOnce(["foo", true])
      .mockReturnValueOnce(["foo"]) as unknown) as ActionHandler<any>;
    const handler2 = (jest
      .fn()
      .mockReturnValueOnce(["bar"])
      .mockReturnValueOnce(["bar"]) as unknown) as ActionHandler<any>;
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
