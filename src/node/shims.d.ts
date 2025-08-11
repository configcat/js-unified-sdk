/* Shim types to be referenced in builds targeting Node.js. (For further explanation, see gulpfile.js.) */

declare module "http" {
  export interface Agent { }
}

declare module "https" {
  export interface Agent { }
}
