// See https://stackoverflow.com/a/72237137/8656352
export function allowEventLoop(waitMs = 0): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, waitMs));
}

export function normalizeLineEndings(text: string, eol = "\n"): string {
  return text.replace(/\r\n?|\n/g, eol);
}

export function escapeRegExp(text: string): string {
  // See also: https://tc39.es/ecma262/#prod-SyntaxCharacter
  return text.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
}

export function normalizePathSeparator(path: string): string {
  return path.replace(/\\/g, "/");
}

export function isWeakRefAvailable(): boolean {
  return typeof WeakRef !== "undefined";
}
