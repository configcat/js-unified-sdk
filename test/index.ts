import { normalizePathSeparator } from "./helpers/utils";

export function isTestSpec(file: string, platform: string): [isMatch: boolean, segments: string[]] {
  const segments = normalizePathSeparator(file).split("/");
  const index = segments[0] === "." ? 0 : segments.indexOf("test");
  if (index >= 0) {
    segments.splice(0, index + 1);
  }

  const isMatch = (segments.length < 2 || segments[0] === platform)
    && /Tests\.ts$/.test(segments[segments.length - 1]);

  return [isMatch, segments];
}
