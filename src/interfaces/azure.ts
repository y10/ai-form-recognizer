export type AzureCredentialType = "Default" | "Key";

export interface IAzureCredentials {
  type: AzureCredentialType;
  toString(): string;
}

