import { assert, expect } from "chai";
import { ObjectEntriesPolyfill, ObjectValuesPolyfill } from "#lib/Polyfills";

describe("Polyfills", () => {
  it("Object.values polyfill should work", () => {
    assert.deepEqual([], ObjectValuesPolyfill<any>("" as any));

    assert.deepEqual([], ObjectValuesPolyfill<any>([]));
    // eslint-disable-next-line no-sparse-arrays
    expect(ObjectValuesPolyfill<any>([1, , "b"])).to.have.members([1, "b"]);

    assert.deepEqual([], ObjectValuesPolyfill<any>({}));
    // eslint-disable-next-line @stylistic/quote-props
    expect(ObjectValuesPolyfill<any>({ "a": 1, 2: "b" })).to.have.members([1, "b"]);
  });

  it("Object.entries polyfill should work", () => {
    assert.deepEqual([], ObjectEntriesPolyfill<any>("" as any));

    assert.deepEqual([], ObjectEntriesPolyfill<any>([]));
    // eslint-disable-next-line no-sparse-arrays
    expect(ObjectEntriesPolyfill<any>([1, , "b"])).to.have.deep.members([["0", 1], ["2", "b"]]);

    assert.deepEqual([], ObjectEntriesPolyfill<any>({}));
    // eslint-disable-next-line @stylistic/quote-props
    expect(ObjectEntriesPolyfill<any>({ "a": 1, 2: "b" })).to.have.deep.members([["a", 1], ["2", "b"]]);
  });
});
