import { create } from "./reshaper";

describe("reshaper", () => {
  it("creates a reshaper", async () => {
    const reshaper = create<any>();

    const handler = jest.fn(() => [true, true]);
    reshaper.addHandlers([handler as any]);

    const handleChange = jest.fn();
    reshaper.addOnChange(handleChange);

    const wait = new Promise(resolve => {
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

    const wait = new Promise(resolve => {
      reshaper.addHandlers([
        () => {
          setTimeout(() => resolve(), 1);
          return [state];
        },
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
      true,
    ]);
    reshaper.addHandlers([handler as any]);

    const handleChange = jest.fn();
    reshaper.addOnChange(handleChange);

    const wait = new Promise(resolve => {
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
      true,
    ]);
    reshaper.addHandlers([handler as any]);

    const handleChange = jest.fn();
    reshaper.addOnChange(handleChange);

    const wait = new Promise(resolve => {
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
      param: "two",
    });
  });
});
