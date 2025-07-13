/* Shim types to be referenced in Node.js-related builds. (For further explanation, see gulpfile.js.) */

declare module "http" {
  export interface Agent { }
}

declare module "https" {
  export interface Agent { }
}
