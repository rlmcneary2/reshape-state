export function queue<T>() {
  const taskQueue = new Set<() => void>();
  let active = false;

  async function process() {
    active = true;

    if (taskQueue.size < 1) {
      active = false;
      return;
    }

    const task: () => Promise<void> = taskQueue.values().next().value;
    taskQueue.delete(task);

    try {
      await task();
    } catch (err) {
      console.error("Error processing task.", err);
    }

    if (taskQueue.size < 1) {
      active = false;
      return;
    }

    setTimeout(() => process(), 0);
  }

  return function<T>(task: Task<T>): TaskResult<T> {
    let resolve: (value?: T | Promise<T>) => void;
    let reject: (reason?: any) => void;
    const result = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    const queuedItem = () => {
      try {
        resolve(task());
      } catch (err) {
        reject(err);
      }
    };

    taskQueue.add(queuedItem);

    setTimeout(() => !active && process(), 0);

    return {
      cancel: () => {
        taskQueue.delete(queuedItem);
        resolve();
      },
      result
    };
  };
}

export type Task<T> = () => T;

export type TaskResult<T> = {
  cancel: () => void;
  result: Promise<T>;
};
