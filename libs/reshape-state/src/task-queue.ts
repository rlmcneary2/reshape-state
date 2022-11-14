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

  return function queueItem<T>(task: Task<T>): QueueItemResult<T> {
    let resolveTask: PromiseResolver<TaskResult<T>>;
    const result = new Promise<TaskResult<T>>(res => (resolveTask = res));
    let canceled = false;

    const queuedItem = async () => {
      let r: Awaited<T>;
      try {
        r = await Promise.resolve(task());
      } catch (err) {
        console.error("Error processing task.", err);
        resolveTask({ error: err });
        return;
      }

      !canceled && resolveTask({ taskResult: r });
    };

    taskQueue.add(queuedItem);

    setTimeout(() => {
      !active && processTaskQueueValues();
    }, 0);

    return {
      cancel: () => {
        canceled = true;
        taskQueue.delete(queuedItem);
        resolveTask({ cancel: true });
      },
      result
    };
  };
}

export type Task<T> = () => T;

export interface QueueItemResult<T> {
  cancel: () => void;
  result: Promise<TaskResult<T>>;
}

export type TaskResult<T> =
  | TaskSuccessResult<T>
  | TaskCancelResult
  | TaskErrorResult;

export interface TaskSuccessResult<T> {
  taskResult: T;
}

export interface TaskCancelResult
  extends Omit<TaskSuccessResult<void>, "taskResult"> {
  cancel: true;
}

export interface TaskErrorResult
  extends Omit<TaskSuccessResult<void>, "taskResult"> {
  error: unknown;
}

type PromiseResolver<T> = (value: T | PromiseLike<T>) => void;
