import { queue } from "./task-queue";

describe("task-queue", () => {
  it("runs a task", async () => {
    const val = await queue()(() => 1 + 1).result;
    expect(val).toBe(2);
  });

  it("runs an async task", async () => {
    const { result } = queue()(
      () => new Promise(resolve => setTimeout(() => resolve("completed"), 1))
    );

    const val = await result;
    expect(val).toBe("completed");
  });

  it("cancels a task", async () => {
    const { cancel, result } = queue()(
      () => new Promise(resolve => setTimeout(() => resolve("completed"), 200))
    );

    await new Promise(resolve => setTimeout(() => resolve(), 1));

    cancel();
    const val = await result;
    expect(val).toBeUndefined();
  });

  it("catches a task error", async () => {
    const { result } = queue()(() => {
      throw Error("Test error.");
    });

    const val = await result;
    expect(val).toBeUndefined();
  });

  it("processes tasks in order", async () => {
    const addTask = queue();
    const { result } = addTask(
      () => new Promise(resolve => setTimeout(() => resolve(true), 100))
    );
    const { result: resultSync } = addTask(() => 1 + 1);
    const val = await Promise.race([result, resultSync]);
    expect(typeof val).toBe("boolean");
    expect(val).toBe(true);
  });
});
