import { assert } from "chai";
import { CdnConfigLocation, ConfigLocation, LocalFileConfigLocation } from "./helpers/ConfigLocation";
import { FakeLogger } from "./helpers/fakes";
import { platform } from "./helpers/platform";
import { normalizeLineEndings } from "./helpers/utils";
import { User } from "#lib";
import { LogLevel, LoggerWrapper } from "#lib/ConfigCatLogger";
import { SettingValue } from "#lib/ProjectConfig";
import { RolloutEvaluator, evaluate } from "#lib/RolloutEvaluator";
import { WellKnownUserObjectAttribute } from "#lib/User";
import { errorToString } from "#lib/Utils";

const testDataBasePath = () => platform().pathJoin("test", "data", "evaluationlog");

type TestSet = {
  sdkKey: string;
  baseUrl?: string;
  jsonOverride?: string;
  tests?: ReadonlyArray<TestCase>;
};

type TestCase = {
  key: string;
  defaultValue: SettingValue;
  returnValue: NonNullable<SettingValue>;
  expectedLog: string;
  user?: Readonly<{ [key: string]: string }>;
};

describe("Evaluation log", () => {
  describeTestSet("simple_value");
  describeTestSet("1_targeting_rule");
  describeTestSet("2_targeting_rules");
  describeTestSet("options_based_on_user_id");
  describeTestSet("options_based_on_custom_attr");
  describeTestSet("options_after_targeting_rule");
  describeTestSet("options_within_targeting_rule");
  describeTestSet("and_rules");
  describeTestSet("segment");
  describeTestSet("prerequisite_flag");
  describeTestSet("comparators");
  describeTestSet("epoch_date_validation");
  describeTestSet("number_validation");
  describeTestSet("semver_validation");
  describeTestSet("list_truncation");
});

function describeTestSet(testSetName: string) {
  const testSetData = platform().readFileUtf8(platform().pathJoin(testDataBasePath(), testSetName + ".json"));
  if (typeof testSetData === "string") {
    for (const [configLocation, testCase] of getTestCases(testSetData)) {
      const userJson = JSON.stringify(testCase.user ?? null).replace(/"/g, "'");
      it(`${testSetName} - ${configLocation} | ${testCase.key} | ${testCase.defaultValue} | ${userJson}`, () =>
        runTest(testSetName, configLocation, testCase));
    }
  }
  else {
    it(testSetName, async () => {
      for (const [configLocation, testCase] of getTestCases(await testSetData)) {
        runTest(testSetName, configLocation, testCase);
      }
    });
  }
}

function* getTestCases(testSetData: string): Generator<[ConfigLocation, TestCase], void, undefined> {
  const testSet: TestSet = JSON.parse(testSetData);

  const configLocation = testSet.sdkKey
    ? new CdnConfigLocation(testSet.sdkKey, testSet.baseUrl)
    : new LocalFileConfigLocation(testDataBasePath(), "_overrides", testSet.jsonOverride!);

  for (const testCase of testSet.tests ?? []) {
    yield [configLocation, testCase];
  }
}

function createUser(userRaw?: Readonly<{ [key: string]: string }>): User | undefined {
  if (!userRaw) {
    return;
  }

  const identifierAttribute: WellKnownUserObjectAttribute = "Identifier";
  const emailAttribute: WellKnownUserObjectAttribute = "Email";
  const countryAttribute: WellKnownUserObjectAttribute = "Country";

  const user = new User(userRaw[identifierAttribute]);

  const email = userRaw[emailAttribute];
  if (email) {
    user.email = email;
  }

  const country = userRaw[countryAttribute];
  if (country) {
    user.country = country;
  }

  const wellKnownAttributes: string[] = [identifierAttribute, emailAttribute, countryAttribute];
  for (const attributeName of Object.keys(userRaw)) {
    if (wellKnownAttributes.indexOf(attributeName) < 0) {
      user.custom[attributeName] = userRaw[attributeName];
    }
  }

  return user;
}

function formatLogEvent(event: FakeLogger["events"][0]) {
  const [level, eventId, message, exception] = event;

  const levelString =
    level === LogLevel.Debug ? "DEBUG"
    : level === LogLevel.Info ? "INFO"
    : level === LogLevel.Warn ? "WARNING"
    : level === LogLevel.Error ? "ERROR"
    : LogLevel[level].toUpperCase().padStart(5);

  const exceptionString = exception !== void 0 ? "\n" + errorToString(exception, true) : "";

  return `${levelString} [${eventId}] ${message}${exceptionString}`;
}

async function runTest(testSetName: string, configLocation: ConfigLocation, testCase: TestCase) {
  const config = await configLocation.fetchConfigCachedAsync();

  const fakeLogger = new FakeLogger();
  const logger = new LoggerWrapper(fakeLogger);
  const evaluator = new RolloutEvaluator(logger);

  const user = createUser(testCase.user);
  const evaluationDetails = evaluate(evaluator, config.settings, testCase.key, testCase.defaultValue, user, null, logger);
  const actualReturnValue = evaluationDetails.value;

  assert.strictEqual(actualReturnValue, testCase.returnValue);

  const expectedLogFilePath = platform().pathJoin(testDataBasePath(), testSetName, testCase.expectedLog);
  const expectedLogText = normalizeLineEndings(await platform().readFileUtf8(expectedLogFilePath)).replace(/(\r|\n)*$/, "");
  const actualLogText = fakeLogger.events.map(e => formatLogEvent(e)).join("\n");

  assert.strictEqual(actualLogText, expectedLogText);
}
