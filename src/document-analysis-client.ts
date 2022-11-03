import { IAzureCredentials } from "./interfaces/azure.ts";
import {
  AnalyseInput,
  AnalyzeResult,
  IAsyncAnalyzeResult,
  AnalyzeOperationResult,
  AnalyseOptions,
  KnownApiVersion,
  PrebuilModel,
} from "./interfaces/document-analysis.ts";

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
  ): Promise<AnalyzeOperationResult<AnalyzeResult>> {
    return await this.beginAnalyze(PrebuilModel.document, input);
  }

  public async beginAnalyzeDocumentFromUrl(
    formUrl: string
  ): Promise<AnalyzeOperationResult<AnalyzeResult>> {
    return await this.beginAnalyze(
      PrebuilModel.document,
      `{'urlSource': '${formUrl}'}`
    );
  }

  public async beginAnalyze<TResult>(
    model: string,
    input: AnalyseInput
  ): Promise<AnalyzeOperationResult<TResult>> {
    const contentType =
      typeof input === "string"
        ? "application/json"
        : "application/octet-stream";
    const response = await fetch(
      `${this.endpoint}formrecognizer/documentModels/${model}:analyze?api-version=${this.options.version}`,
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
    if (!id) {
      throw new Error("Missing apim-request-id header");
    }

    return {
      id,
      model,
      status: "notStarted",
      createdOn: new Date(),
      lastUpdatedOn: new Date(),
    };
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
    const awaiter = await this.awaitResults<TResult>(model, input);
    const callbackUrl = options?.callbackUrl;
    if (callbackUrl) {
      setTimeout(async () => {
        try {
          const results = await awaiter.wait(options?.abort);
          await this.sendResults(callbackUrl, results);
        } catch (error) {
          await this.sendResults(callbackUrl, error);
        }
      }, 1000);

      return await awaiter.progress();
    } else {
      return await awaiter.wait(options?.abort);
    }
  }

  public async retrieveResults<TResult>(
    model: string,
    requestId: string
  ): Promise<AnalyzeOperationResult<TResult>> {
    const response = await fetch(
      `${this.endpoint}formrecognizer/documentModels/${model}/analyzeResults/${requestId}?api-version=${this.options.version}`,
      {
        method: "GET",
        headers: [["Ocp-Apim-Subscription-Key", this.credentials.toString()]],
      }
    );

    const result = await response.json();
    return { ...result, model, id: requestId };
  }

  public async awaitResults<TResult>(
    model: string,
    input: AnalyseInput
  ): Promise<IAsyncAnalyzeResult<TResult>> {
    let progress = await this.beginAnalyze<TResult>(model, input);
    return <IAsyncAnalyzeResult<TResult>>{
      wait: (abort) => {
        if (progress.id) {
          return new Promise((ok, reject) => {
            setTimeout(async () => {
              while (true) {
                if (abort?.aborted) {
                  reject(
                    new Error("Document analysis operation has been aborted.")
                  );
                  break;
                }
                progress = await this.retrieveResults<TResult>(
                  progress.model,
                  progress.id
                );
                if (progress?.error) {
                  reject(progress);
                  break;
                }
                if (progress?.analyzeResult) {
                  ok(progress);
                  break;
                }
                await new Promise((done) => setTimeout(done, 1000));
              }
            }, 1000);
          });
        }
      },
      error() {
        return progress.error;
      },
      result() {
        return progress.analyzeResult;
      },
      progress: async () => {
        if (progress.id) {
          if (!progress.analyzeResult || !progress.error) {
            progress = await this.retrieveResults<TResult>(
              progress.model,
              progress.id
            );
          }
        }
        return progress;
      },
    };
  }

  private async sendResults<TResult>(
    uri: string,
    result: AnalyzeOperationResult<TResult>
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
