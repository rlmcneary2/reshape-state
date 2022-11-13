/**
 * Create a queue.
 * @returns The "addTask" function that can be used to add tasks to the queue.
 */
export function queue() {
  const taskQueue = new Set<() => void>();
  let active = false;

  async function processTaskQueueValues() {
    active = true;

    if (taskQueue.size < 1) {
      active = false;
      return;
    }

    const taskQueueValue: () => Promise<void> = taskQueue.values().next().value;
    taskQueue.delete(taskQueueValue);

    await taskQueueValue();

    if (taskQueue.size < 1) {
      active = false;
      return;
    }

    setTimeout(() => processTaskQueueValues(), 0);
  }

  return function queueItem<T, CancelData = void>(task: Task<T>): TaskResult<T, CancelData> {
    let resolveTask: PromiseResolver<T, CancelData>;
    const result = new Promise<T | CancelData>(res => (resolveTask = res));
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
      !active && processTaskQueueValues();
    }, 0);

    return {
      cancel: (data: CancelData) => {
        canceled = true;
        taskQueue.delete(queuedItem);
        resolveTask(data);
      },
      result
    };
  };
}

export type Task<T> = () => T;

export interface TaskResult<T, CancelData = void> {
  cancel: (data: CancelData) => void;
  result: Promise<T | CancelData>;
};

type PromiseResolver<T, CancelData = void> = (value: T | PromiseLike<T> | CancelData) => void;
