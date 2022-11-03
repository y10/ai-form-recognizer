# Azure Form Recognizer client library for Deno

A port of Azure Cognitive Services [Form Recognizer][ai-form-recognizer] for **Deno** is a cloud service that uses machine learning to analyze text and structured data from your documents. It includes the following main features:

- Layout - Extract text, table structures, and selection marks, along with their bounding region coordinates, from documents.
- Document - Analyze entities, key-value pairs, tables, and selection marks from documents using the general prebuilt document model.
- Read - Read information about textual elements, such as page words and lines in addition to text language information.
- Prebuilt - Analyze data from certain types of common documents (such as receipts, invoices, business cards, or identity documents) using prebuilt models.
- Custom - Build custom models to extract text, field values, selection marks, and table data from documents. Custom models are built with your own data, so they're tailored to your documents.

[Source code](https://github.com/y10/ai-form-recognizer/) |
[Package (NPM)](https://www.npmjs.com/package/@azure/ai-form-recognizer) |
[API reference documentation](https://docs.microsoft.com/javascript/api/@azure/ai-form-recognizer) |
[Product documentation](https://docs.microsoft.com/azure/cognitive-services/form-recognizer/) |
[Samples](https://github.com/y10/ai-form-recognizer/samples)

## Getting started

```javascript
import { DocumentAnalysisClient, AzureKeyCredential } from "https://cdn.jsdelivr.net/gh/y10/ai-form-recognizer/mod.ts";

const credential = new AzureKeyCredential("<api key>");
const client = new DocumentAnalysisClient(
  "https://<resource name>.cognitiveservices.azure.com",
  credential
);

// Form Recognizer supports many different types of files.
const awaiter = await client.analyzeFromUrl("<model ID>", "https://your.website.com/shared/document.pdf");

const result = await awaiter.wait();
```

### Prerequisites

- An [Azure subscription][azure_sub]
- A [Cognitive Services or Form Recognizer resource][fr_or_cs_resource]. If you need to create the resource, you can use the [Azure Portal][azure_portal] or [Azure CLI][azure_cli].

[azure_cli]: https://docs.microsoft.com/cli/azure
[azure_sub]: https://azure.microsoft.com/free/
[azure_portal]: https://portal.azure.com
[azure_js_sdk]: https://github.com/Azure/azure-sdk-for-js
[ai-form-recognizer]: https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/formrecognizer/ai-form-recognizer
[fr_or_cs_resource]: https://docs.microsoft.com/azure/cognitive-services/cognitive-services-apis-create-account?tabs=multiservice%2Cwindows