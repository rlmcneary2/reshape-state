/**
 * Create a queue.
 * @returns The "addTask" function that can be used to add tasks to the queue.
 */
export function queue<T>() {
  const taskQueue = new Set<() => void>();
  let active = false;

  async function process() {
    active = true;

    if (taskQueue.size < 1) {
      active = false;
      return;
    }

    const queudItem: () => Promise<void> = taskQueue.values().next().value;
    taskQueue.delete(queudItem);

    await queudItem();

    if (taskQueue.size < 1) {
      active = false;
      return;
    }

    setTimeout(() => process(), 0);
  }

  return function<T>(task: Task<T>): TaskResult<T> {
    let resolveTask: (value?: T | Promise<T>) => void;
    const result = new Promise<T>(res => (resolveTask = res));
    let canceled = false;

    const queuedItem = async () => {
      let r: any;
      try {
        r = await Promise.resolve(task());
      } catch (err) {
        console.error("Error processing task.", err);
      }

      !canceled && resolveTask(r);
    };

    taskQueue.add(queuedItem);

    setTimeout(() => {
      !active && process();
    }, 0);

    return {
      cancel: () => {
        canceled = true;
        taskQueue.delete(queuedItem);
        resolveTask();
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
