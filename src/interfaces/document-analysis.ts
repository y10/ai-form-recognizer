import {
  ErrorModel,
  OperationStatus,
} from "./document-analysis-models.ts";

export * from "./document-analysis-models.ts";

/**
 * Async operation awaiter. Once wated, will pull the results until completed.
 */
export interface IAsyncAwaiter<TResult extends { id: string }> {
  /**
   * Starts pulling the result into the progress property and returns the result once completed
   */
  wait(abort?: AbortSignal): Promise<TResult>;
  /**
   * Aborts the operation
   */
  abort(): void;

   /**
   * Current progress status
   */
  get status(): OperationStatus;

  /**
   *  gets the current progress
   */
  get progress(): TResult;
}

/** Status and result of the analyze operation. */
export interface AnalyzeOperationResult<TResult> {
  /** Operation id. */
  id: string;
  /** Model name. */
  model: string;
  /** Operation status. */
  status: OperationStatus;
  /** Date and time (UTC) when the analyze operation was submitted. */
  createdOn: Date;
  /** Date and time (UTC) when the status was last updated. */
  lastUpdatedOn: Date;
  /** Encountered error during document analysis. */
  error?: ErrorModel;
  /** Document analysis result. */
  analyzeResult?: TResult;
}

export interface AnalyseOptions {
  callbackUrl?: string,
  timeout?: number,
  abort?: AbortSignal
}

export type AnalyseInput =
  | Blob
  | ArrayBuffer
  | ArrayBufferView
  | BufferSource
  | ReadableStream<Uint8Array>
  | string;

/** Known values of prebilt models that the service accepts. */
export enum PrebuilModel {
  /** TwoThousandTwentyTwo0831 */
  document = "prebuilt-document",
}

export class AnalyseError extends Error{
  constructor(error: ErrorModel)  
  constructor(arg?: string | ErrorModel, error?: ErrorModel)  {
    super(
      typeof(arg) === "string" ? arg : error?.message
    )
  }
}
