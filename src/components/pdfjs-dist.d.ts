declare module 'pdfjs-dist/build/pdf.mjs' {
  export const GlobalWorkerOptions: {
    workerSrc: string;
  };
  export function getDocument(src: unknown): {
    promise: Promise<{
      numPages: number;
      getPage(pageNumber: number): Promise<{
        getTextContent(): Promise<{
          items: { str: string }[];
        }>;
      }>;
    }>;
  };
}

declare module 'pdfjs-dist/build/pdf.worker.mjs' {
  const worker: object;
  export = worker;
}
