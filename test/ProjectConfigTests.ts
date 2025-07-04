import { assert } from "chai";
import { deserializeConfig, prepareConfig, ProjectConfig } from "#lib/ProjectConfig";

describe("ProjectConfig", () => {
  it("isEmpty - empty instance should be empty", () => {
    assert.isTrue(ProjectConfig.empty.isEmpty);
  });

  it("isEmpty - empty instance with increased timestamp should be empty", () => {
    assert.isTrue(ProjectConfig.empty.with(1000).isEmpty);
  });

  it("isEmpty - instance with config should not be empty", () => {
    assert.isFalse(new ProjectConfig("{}", prepareConfig({}), 1000, "\"eTag\"").isEmpty);
  });

  it("with - returned instance should contain the same data except for timestamp - empty", () => {
    const timestamp = 1000;
    const returnedPc = ProjectConfig.empty.with(timestamp);
    assert.isUndefined(returnedPc.config);
    assert.isUndefined(returnedPc.configJson);
    assert.isUndefined(returnedPc.httpETag);
    assert.equal(returnedPc.timestamp, timestamp);
  });

  it("with - returned instance should contain the same data except for timestamp - non-empty", () => {
    const timestamp = 2000;
    const pc = new ProjectConfig("{}", prepareConfig({}), 1000, "\"eTag\"");
    const returnedPc = pc.with(timestamp);
    assert.equal(returnedPc.config, pc.config);
    assert.equal(returnedPc.configJson, pc.configJson);
    assert.equal(returnedPc.httpETag, pc.httpETag);
    assert.equal(returnedPc.timestamp, timestamp);
  });

  it("isExpired - empty instance is expired", () => {
    assert.isTrue(ProjectConfig.empty.isExpired(1000));
  });

  it("isExpired - empty instance with increased timestamp is expired when timestamp is too old", () => {
    const timestamp = ProjectConfig.generateTimestamp() - 2000;
    assert.isTrue(ProjectConfig.empty.with(timestamp).isExpired(1000));
  });

  it("isExpired - empty instance with increased timestamp is not expired when timestamp is not old enough", () => {
    const timestamp = ProjectConfig.generateTimestamp();
    assert.isFalse(ProjectConfig.empty.with(timestamp).isExpired(1000));
  });

  it("isExpired - instance with config is expired when timestamp is too old", () => {
    const timestamp = ProjectConfig.generateTimestamp() - 2000;
    assert.isTrue(new ProjectConfig("{}", prepareConfig({}), timestamp, "\"eTag\"").isExpired(1000));
  });

  it("isExpired - instance with config is not expired when timestamp is not old enough", () => {
    const timestamp = ProjectConfig.generateTimestamp();
    assert.isFalse(new ProjectConfig("{}", prepareConfig({}), timestamp, "\"eTag\"").isExpired(1000));
  });

  it("serialization works - empty", () => {
    const pc = ProjectConfig.empty;

    const serializedPc = ProjectConfig.serialize(pc);
    const deserializedPc = ProjectConfig.deserialize(serializedPc);

    assert.isUndefined(deserializedPc.config);
    assert.isUndefined(deserializedPc.configJson);
    assert.isUndefined(deserializedPc.httpETag);
    assert.equal(deserializedPc.timestamp, pc.timestamp);
    assert.isTrue(deserializedPc.isEmpty);
  });

  it("serialization works - non-empty", () => {
    const pc = new ProjectConfig("{}", prepareConfig({}), 1000, "\"eTag\"");

    const serializedPc = ProjectConfig.serialize(pc);
    const deserializedPc = ProjectConfig.deserialize(serializedPc);

    assert.isObject(deserializedPc.config);
    assert.equal(deserializedPc.configJson, pc.configJson);
    assert.equal(deserializedPc.httpETag, pc.httpETag);
    assert.equal(deserializedPc.timestamp, pc.timestamp);
    assert.isFalse(deserializedPc.isEmpty);
  });

  for (const [configJson, expectedPath, expectedErrorType] of <[string, string?, string?][]>[
    ["null", "$", "Missing required value"],
    ["[]", "$", "Type mismatch"],
    ["{}"],
    ['{"s":null}'],
    ['{"s":{}}', "$.s", "Type mismatch"],
    ['{"s":[]}'],
    ['{"s":[null]}', "$.s[0]", "Missing required value"],
    ['{"f":null}'],
    ['{"f":[]}', "$.f", "Type mismatch"],
    ['{"f":{}}'],
    ['{"f":{"flag":null}}', "$.f.flag", "Missing required value"],
    ['{"s":[{"n":"Beta users","r":[{"a":"Email","c":16,"l":[1, null]}]}]}', "$.s[0].r[0].l[0]", "Type mismatch"],
    ['{"s":[{"n":"Beta users","r":[{"a":"Email","c":16,"l":["",null]}]}]}', "$.s[0].r[0].l[1]", "Missing required value"],
  ]) {
    it(`Type checking works - configJson: ${configJson}`, () => {
      try {
        deserializeConfig(configJson);
        if (expectedPath) {
          assert.fail("Expected error but none was thrown.");
        }
      } catch (err) {
        if (!expectedPath) {
          assert.fail("Didn't expect error but one was thrown. " + err);
        }
        assert.instanceOf(err, TypeError);
        assert.isTrue(err.message.endsWith(expectedPath));
        assert.include(err.message, expectedErrorType!);
      }
    });
  }
});
