export type AzureCredentialType = "Default" | "Key";

export interface IAzureCredentials {
  type: AzureCredentialType;
  toString(): string;
}

export class AzureKeyCredential implements IAzureCredentials {
  constructor(private key: string) { }

  get type(): AzureCredentialType {
    return "Key";
  }

  public toString(): string {
    return this.key;
  }
}

