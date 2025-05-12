import { FetchApiConfigFetcher } from "../browser";

export class DenoHttpConfigFetcher extends FetchApiConfigFetcher {
  protected override runsOnServerSide = true;
}
