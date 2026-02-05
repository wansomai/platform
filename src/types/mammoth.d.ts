declare module 'mammoth/mammoth.browser' {
  interface ConversionResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }

  interface Options {
    arrayBuffer?: ArrayBuffer;
    path?: string;
  }

  export function convertToHtml(options: Options): Promise<ConversionResult>;
  export function convertToMarkdown(options: Options): Promise<ConversionResult>;
  export function extractRawText(options: Options): Promise<ConversionResult>;
}
