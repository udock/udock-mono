type TypicalCallBack<T> = (error: Error | null, result?: T) => void

type Action<T> = (callback: TypicalCallBack<T>) => void

declare module 'async-task-mgr' {
  class AsyncTask {
    addTask<T>(name: string, action: Action<T>, cb: TypicalCallBack<T>): void;
  }
  export = AsyncTask;
}
