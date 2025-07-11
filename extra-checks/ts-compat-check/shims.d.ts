declare module "http" {
  export class Agent { }
  export type OutgoingHttpHeader = unknown;
}

declare module "https" {
  export class Agent { }
}

declare module "@cloudflare/workers-types/2023-03-01" {
}

declare namespace chrome {
  export namespace storage {
    export class LocalStorageArea { }
  }
}
