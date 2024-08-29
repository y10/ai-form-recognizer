import { IAzureCredentials } from "./azure.ts";
import {
  AnalyseInput,
  AnalyzeResult,
  IAsyncAwaiter,
  AnalyzeOperationResult,
  AnalyseOptions,
  KnownApiVersion,
  PrebuilModel,
  AnalyseError,
} from "./interfaces/document-analysis.ts";
import { AsyncAwaiter } from "./document-analysis-utils.ts";


export class DocumentAnalysisClient {
  options: {
    version: string;
  };

  constructor(
    private endpoint: string,
    private credentials: IAzureCredentials,
    options?: {
      version?: string;
    }
  ) {
    const { version } = options ?? {
      version: KnownApiVersion.TwoThousandTwentyTwo0831,
    };
    this.options = {
      version: version ?? KnownApiVersion.TwoThousandTwentyTwo0831,
    };
  }

  public async beginAnalyzeDocument(
    input: AnalyseInput
  ): Promise<IAsyncAwaiter<AnalyzeOperationResult<AnalyzeResult>>> {
    return await this.beginAnalyze<AnalyzeResult>(PrebuilModel.document, input);
  }

  public async beginAnalyzeDocumentFromUrl(
    formUrl: string
  ): Promise<IAsyncAwaiter<AnalyzeOperationResult<AnalyzeResult>>> {
    return await this.beginAnalyze<AnalyzeResult>(
      PrebuilModel.document,
      `{'urlSource': '${formUrl}'}`
    );
  }

  public async beginAnalyze<TResult>(
    /**
     * @model form recognition model name
     */
    model: string,
    /**
     * @input a document to analize
     */
    input: AnalyseInput,
    /**
     * @options set timeout and abort signal
     */
    options?: { timeout?: number; abort?: AbortSignal }
  ): Promise<IAsyncAwaiter<AnalyzeOperationResult<TResult>>> {
    let progress = await this.postDocument<AnalyzeOperationResult<TResult>>(input, model);
    const id = progress.id;
    const terminator = new AbortController();
    const abort = options?.abort;
    const signal = terminator.signal;
    const timeout = options?.timeout || 1000;
    const promise = new Promise<AnalyzeOperationResult<TResult>>(
      (ok, reject) => {
        setTimeout(async () => {
          let attempt = 0;
          while (true) {
            if (signal.aborted) {
              reject("Document analysis operation has been aborted.");
              break;
            }

            if (abort && abort.aborted) {
              terminator.abort();
              continue;
            }

            progress = await this.getResults<AnalyzeOperationResult<TResult>>(model, id);

            if (progress.error) {
              reject(new AnalyseError(progress.error));
              break;
            }
            if (progress.analyzeResult) {
              ok(progress);
              break;
            }

            await new Promise((done) =>
              setTimeout(done, Math.pow(2, ++attempt) * timeout)
            );
          }
        }, timeout);
      }
    );
    return new AsyncAwaiter({
      wait: async (abort?: AbortSignal) => {
        if (abort) {
          return await Promise.race([
            promise,
            new Promise<never>((_, reject) => {
              abort.addEventListener("abort", () => {
                terminator.abort();
                reject(Error("Wait aborted."));
              });
            }),
          ]);
        }

        return await promise;
      },
      abort() {
        terminator.abort();
      },
      get status() {
        return signal.aborted ? "canceled" : progress.status || "notStarted";
      },
      get progress() {
        return progress;
      },
    });
  }

  public async analyzeDocument(
    input: AnalyseInput,
    options?: AnalyseOptions
  ): Promise<AnalyzeOperationResult<AnalyzeResult>> {
    return await this.analyze<AnalyzeResult>(
      PrebuilModel.document,
      input,
      options
    );
  }

  public async analyzeDocumentFromUrl(
    formUrl: string,
    options?: AnalyseOptions
  ): Promise<AnalyzeOperationResult<AnalyzeResult>> {
    return await this.analyze<AnalyzeResult>(
      PrebuilModel.document,
      `{'urlSource': '${formUrl}'}`,
      options
    );
  }

  public async analyze<TResult>(
    model: string,
    input: AnalyseInput,
    options?: AnalyseOptions
  ) {
    const awaiter = await this.beginAnalyze<TResult>(model, input);
    const callbackUrl = options?.callbackUrl;
    if (callbackUrl) {
      let error;
      try {
        await awaiter.wait();
      } catch (e) {
        error = e;
      }

      if (error) {
        await this.sendResults(callbackUrl, {
          id: awaiter.progress.id,
          error,
        });
      } else {
        await this.sendResults(callbackUrl, awaiter.progress);
      }

      return awaiter.progress;
    } else {
      return await awaiter.wait();
    }
  }

  public async postDocument<TResult>(input: AnalyseInput, model: string): Promise<TResult> {
    const contentType =
      typeof input === "string"
        ? "application/json"
        : "application/octet-stream";
    const response = await fetch(
      `${this.endpoint}documentintelligence/documentModels/${model}:analyze?api-version=${this.options.version}`,
      {
        method: "POST",
        headers: [
          ["Content-Type", contentType],
          ["Ocp-Apim-Subscription-Key", this.credentials.toString()],
        ],
        body: input,
      }
    );

    const id = response.headers.get("apim-request-id");
    if (!id) throw new Error("Missing apim-request-id header");

    return <TResult>{
      id,
      model,
      status: "notStarted",
      createdOn: new Date(),
      lastUpdatedOn: new Date(),
    };
  }

  public async getResults<TResult extends { id: string }>(
    model: string,
    requestId: string
  ): Promise<TResult> {
    const response = await fetch(
      `${this.endpoint}documentintelligence/documentModels/${model}/analyzeResults/${requestId}?api-version=${this.options.version}`,
      {
        method: "GET",
        headers: [["Ocp-Apim-Subscription-Key", this.credentials.toString()]],
      }
    );

    const result = await response.json();
    return { ...result, model, id: requestId };
  }

  private async sendResults<TResult extends { id: string }>(
    uri: string,
    result: TResult
  ) {
    await fetch(uri, {
      method: "POST",
      headers: [
        ["Content-Type", "application/json"],
        ["Request-ID", result.id],
      ],
      body: JSON.stringify(result),
    });
  }
}
