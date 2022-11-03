import { IAzureCredentials, AzureCredentialType } from "./interfaces/azure.ts";

export class AzureKeyCredential implements IAzureCredentials {
  constructor(private key: string) { }

  get type(): AzureCredentialType {
    return "Key";
  }

  public toString(): string {
    return this.key;
  }
}

