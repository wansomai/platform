declare module 'jszip' {
  class JSZip {
    constructor(data?: ArrayBuffer | Uint8Array | string);
    file(name: string): JSZipObject | null;
    file(pattern: RegExp): JSZipObject[];
    files: Record<string, JSZipObject>;
  }

  interface JSZipObject {
    asText(): string;
    asArrayBuffer(): ArrayBuffer;
    asUint8Array(): Uint8Array;
    name: string;
  }

  export = JSZip;
}
