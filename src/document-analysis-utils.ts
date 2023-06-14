import { IAsyncAwaiter } from "./interfaces/document-analysis.ts";

const awaiters: {
  [key: string]: { awaiter: IAsyncAwaiter<{ id: string }>; timer?: number };
} = {};

class AsyncAwaiterRegister {
  public static add<TAwaiter extends IAsyncAwaiter<{ id: string }>>(
    awaiter: TAwaiter
  ) {
    const { id } = awaiter.progress;
    awaiters[id] = { awaiter };
    return awaiter;
  }
  public static remove<TAwaiter extends IAsyncAwaiter<{ id: string }>>(
    awaiter: TAwaiter
  ) {
    const { id } = awaiter.progress;
    clearTimeout(awaiters[id].timer);
    awaiters[id].timer = setTimeout(() => {
      delete awaiters[id];
    }, 60000);
  }
}

export class AsyncAwaiter<T extends { id: string }>
  implements IAsyncAwaiter<T>
{
  constructor(private readonly awaiter: IAsyncAwaiter<T>) {
    AsyncAwaiterRegister.add(awaiter);
  }

  public static get<TAwaiter extends IAsyncAwaiter<{ id: string }>>(
    id: string
  ) {
    return awaiters[id]?.awaiter as TAwaiter;
  }

  /**
   * Aborts the operation
   */
  async wait(abort?: AbortSignal): Promise<T> {
    try {
      return await this.awaiter.wait(abort);
    } finally {
      AsyncAwaiterRegister.remove(this.awaiter);
    }
  }
  /**
   * Aborts the operation
   */
  abort(): void {
    this.awaiter.abort();
  }

  /**
   * Current progress status
   */
  get status() {
    return this.awaiter.status;
  }

  /**
   *  gets the current progress
   */
  get progress() {
    return this.awaiter.progress;
  }
}
