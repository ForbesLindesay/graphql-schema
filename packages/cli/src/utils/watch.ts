// import asCache from '@graphql-schema/map-as-cache';
import {join} from 'path';
import sane from 'sane';

export enum FileWatchEventType {
  Ready,
  Add,
  Change,
  Delete,
}

export interface FileWatchEventReady {
  kind: FileWatchEventType.Ready;
}
export interface FileWatchEventAdd {
  kind: FileWatchEventType.Add;
  filename: string;
}
export interface FileWatchEventChange {
  kind: FileWatchEventType.Change;
  filename: string;
}
export interface FileWatchEventDelete {
  kind: FileWatchEventType.Delete;
  filename: string;
}

export type FileWatchEvent =
  | FileWatchEventReady
  | FileWatchEventAdd
  | FileWatchEventChange
  | FileWatchEventDelete;

// export default function watch(
//   directoryName: string,
//   glob: string[],
// ): AsyncIterableIterator<FileWatchEvent> {
//   const eventsQueue: IteratorResult<FileWatchEvent>[] = [];
//   let nextResolver: null | ((e: IteratorResult<FileWatchEvent>) => void) = null;
//   let nextReject: null | ((e: Error) => void) = null;
//   let previousError: null | Error = null;
//   const watcher = sane(directoryName, {glob});
//   const onEvent = (e: FileWatchEvent) => {
//     const next = {value: e, done: false};
//     if (nextResolver) {
//       nextResolver(next);
//       nextResolver = null;
//       nextReject = null;
//     } else {
//       eventsQueue.push(next);
//     }
//   };
//   watcher.on('ready', () => {
//     onEvent({kind: FileWatchEventType.Ready});
//   });
//   watcher.on('add', (filename) => {
//     onEvent({
//       kind: FileWatchEventType.Add,
//       filename: join(directoryName, filename),
//     });
//   });
//   watcher.on('change', (filename) => {
//     onEvent({
//       kind: FileWatchEventType.Change,
//       filename: join(directoryName, filename),
//     });
//   });
//   watcher.on('delete', (filename) => {
//     onEvent({
//       kind: FileWatchEventType.Delete,
//       filename: join(directoryName, filename),
//     });
//   });
//   watcher.on('error', (error) => {
//     if (nextReject) {
//       nextReject(error);
//       nextResolver = null;
//       nextReject = null;
//     } else {
//       previousError = error;
//     }
//   });
//   const closeWatcher = () => {
//     watcher.close();
//     process.removeListener('SIGINT', closeWatcher);
//     if (nextResolver) {
//       nextResolver({done: true, value: undefined});
//     } else {
//       eventsQueue.push({done: true, value: undefined});
//     }
//   };
//   process.once('SIGINT', closeWatcher);
//   return {
//     [Symbol.asyncIterator]() {
//       return this;
//     },
//     async next() {
//       return await new Promise<IteratorResult<FileWatchEvent>>(
//         (resolve, reject) => {
//           if (previousError) {
//             reject(previousError);
//             previousError = null;
//           } else if (eventsQueue.length) {
//             resolve(eventsQueue.shift()!);
//           } else {
//             nextResolver = resolve;
//             nextReject = reject;
//           }
//         },
//       );
//     },
//     async return() {
//       closeWatcher();
//       return {done: true, value: undefined};
//     },
//     async throw(e) {
//       closeWatcher();
//       throw e;
//     },
//   };
// }

export function watchCore(
  directoryName: string,
  glob: string[],
  onEvent: (e: FileWatchEvent) => void,
  onClose: (error: Error | null) => void,
) {
  const watcher = sane(directoryName, {glob});
  watcher.on('ready', () => {
    if (closed) return;
    onEvent({kind: FileWatchEventType.Ready});
  });
  watcher.on('add', (filename) => {
    if (closed) return;
    onEvent({
      kind: FileWatchEventType.Add,
      filename: join(directoryName, filename),
    });
  });
  watcher.on('change', (filename) => {
    if (closed) return;
    onEvent({
      kind: FileWatchEventType.Change,
      filename: join(directoryName, filename),
    });
  });
  watcher.on('delete', (filename) => {
    if (closed) return;
    onEvent({
      kind: FileWatchEventType.Delete,
      filename: join(directoryName, filename),
    });
  });
  let closed = false;
  watcher.on('error', (error) => {
    if (closed) return;
    closed = true;
    watcher.close();
    onClose(error);
  });
  const closeWatcher = () => {
    if (closed) return;
    closed = true;
    watcher.close();
    onClose(null);
  };
  return closeWatcher;
}

interface Operation {
  directoryName: string;
  patterns: string[];
  fn: (e?: FileWatchEvent[]) => Promise<Operation[]>;
  onError(err: Error): Promise<number>;
  start({watchEnabled}: {watchEnabled: boolean}): Promise<number>;
}
async function runOperation(operation: Operation): Promise<number> {
  try {
    const childOperations = await operation.fn();
    const statuses = await Promise.all(
      childOperations.map((op) => runOperation(op)),
    );
    return Math.max(0, ...statuses);
  } catch (ex: any) {
    return await operation.onError(ex);
  }
}
interface WatchOperation {
  closeWatch: () => void;
  replace: (op: Operation) => void;
}
function watchOperation(
  operation: Operation,
  onClose: (err: Error | null) => void,
): WatchOperation {
  let closed = false;
  const onCloseOnce = (err: Error | null) => {
    if (closed) return;
    closed = true;
    onClose(err);
    for (const op of childOperations.values()) {
      op.closeWatch();
    }
  };
  const onCloseWatchOnce = (err: Error | null) => {
    if (closed) return;
    closed = true;
    onClose(err);
    console.log('closeWatch', operation.directoryName, operation.patterns);
    closeWatch();
    for (const op of childOperations.values()) {
      op.closeWatch();
    }
  };
  let currentOperation = operation;
  let nextOperation = operation;
  let running = false;
  let queue: FileWatchEvent[] = [];
  const childOperations = new Map<string, WatchOperation>();
  async function runWhileUpdating() {
    if (running) return;
    running = true;
    try {
      try {
        let newChildOperations: Operation[] | undefined;
        while (queue.length || currentOperation !== nextOperation) {
          const events = queue;
          queue = [];
          currentOperation = nextOperation;
          try {
            newChildOperations = await currentOperation.fn(events);
          } catch (ex: any) {
            await currentOperation.onError(ex);
            newChildOperations = [];
          }
        }
        if (newChildOperations !== undefined) {
          const newChildOperationsMap = new Map(
            newChildOperations.map((op) => [
              JSON.stringify([op.directoryName, ...op.patterns.sort()]),
              op,
            ]),
          );
          for (const [key, op] of [...childOperations]) {
            if (!newChildOperationsMap.has(key)) {
              op.closeWatch();
              childOperations.delete(key);
            }
          }
          for (const [key, op] of [...newChildOperationsMap]) {
            const existing = childOperations.get(key);
            if (existing) {
              existing.replace(op);
            } else {
              childOperations.set(
                key,
                watchOperation(op, (err) => {
                  if (err) {
                    onCloseWatchOnce(err);
                  }
                }),
              );
            }
          }
        }
      } finally {
        running = false;
      }
    } catch (ex: any) {
      onCloseWatchOnce(ex);
    }
  }
  console.log('watchCore', operation.directoryName, operation.patterns);
  const closeWatch = watchCore(
    operation.directoryName,
    operation.patterns,
    async (e) => {
      queue.push(e);
      runWhileUpdating();
    },
    onCloseOnce,
  );
  return {
    closeWatch: () => onCloseWatchOnce(null),
    replace: (op: Operation) => {
      nextOperation = op;
      runWhileUpdating();
    },
  };
}

export function createOperation(
  directoryName: string,
  patterns: string[],
  fn: (e?: FileWatchEvent[]) => Promise<Operation[] | void>,
  onError: (e: Error) => Promise<number>,
): Operation {
  return {
    directoryName,
    patterns,
    fn: async (e) => {
      return (await fn(e)) || [];
    },
    onError,
    async start({watchEnabled}: {watchEnabled: boolean}): Promise<number> {
      if (watchEnabled) {
        await new Promise<void>((resolve, reject) => {
          watchOperation(this, (err) => {
            if (err) reject(err);
            else resolve();
          });
          // HACK: Don't bother actually closing the watchers, it's much quicker just to
          // process.exit at the top level
          process.once('SIGINT', () => resolve());
        });
        return 0;
      } else {
        return await runOperation(this);
      }
    },
  };
}
