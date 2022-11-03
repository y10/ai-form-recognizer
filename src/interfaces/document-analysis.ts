import {
  AnalyzeResult,
  AnalyzeResultOperationStatus,
  ErrorModel,
  KnownApiVersion,
} from "./document-analysis-models.ts";

export interface IAsyncAnalyzeResult<TResult> {
  /**
   * Returns a promise that will resolve once the underlying operation is completed.
   */
  wait(abort?: AbortSignal): Promise<AnalyzeOperationResult<TResult>>;

  /**
   * Pools the current progress
   */
  progress(): Promise<AnalyzeOperationResult<TResult>>;

  /**
   * Returns the result value of the operation,
   * regardless of the state of the poller.
   * It can return undefined or an incomplete form of the final TResult value
   * depending on the implementation.
   */
  result(): Promise<TResult | undefined>;

  /**
   * Returns the error of the operation, if any.
   */
  error(): Error | ErrorModel | undefined;
}

/** Status and result of the analyze operation. */
export interface AnalyzeOperationResult<TResult> {
  /** Operation id. */
  id: string;
  /** Model name. */
  model: string;
  /** Operation status. */
  status: AnalyzeResultOperationStatus;
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

export { KnownApiVersion };
export type { AnalyzeResult };
