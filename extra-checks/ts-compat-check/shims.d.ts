declare module "http" {
    export class IncomingMessage { }
    export type OutgoingHttpHeader = unknown;
}

declare module "@cloudflare/workers-types/2023-03-01" {
}

declare namespace chrome {
    export namespace storage {
        export class LocalStorageArea { }
    }
}
