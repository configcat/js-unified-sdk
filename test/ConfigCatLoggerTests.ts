import { assert } from "chai";
import { FakeLogger } from "./helpers/fakes";
import { IConfigCatLogger, LogEventId, LogFilterCallback, LoggerWrapper, LogLevel, LogMessage } from "#lib/ConfigCatLogger";

describe("ConfigCatLogger", () => {
  for (const level of Object.values(LogLevel).filter(key => typeof key === "number") as LogLevel[]) {
    it(`Logging works with level ${LogLevel[level]}`, () => {
      const messages: [LogLevel, LogEventId, LogMessage, any][] = [];

      const loggerImpl = new class implements IConfigCatLogger {
        level = level;
        log(level: LogLevel, eventId: LogEventId, message: LogMessage, exception?: any) {
          messages.push([level, eventId, message, exception]);
        }
      }();

      const logger = new LoggerWrapper(loggerImpl);
      const err = new Error();

      logger.log(LogLevel.Debug, 0, `${LogLevel[LogLevel.Debug]} message`);
      logger.log(LogLevel.Info, 1, `${LogLevel[LogLevel.Info]} message`);
      logger.log(LogLevel.Warn, 2, `${LogLevel[LogLevel.Warn]} message`);
      logger.log(LogLevel.Error, 3, `${LogLevel[LogLevel.Error]} message`, err);

      let expectedCount = 0;
      if (level >= LogLevel.Debug) {
        assert.equal(messages.filter(([level, eventId, msg, ex]) => level === LogLevel.Debug && eventId === 0 && msg === `${LogLevel[level]} message` && ex === void 0).length, 1);
        expectedCount++;
      }

      if (level >= LogLevel.Info) {
        assert.equal(messages.filter(([level, eventId, msg, ex]) => level === LogLevel.Info && eventId === 1 && msg === `${LogLevel[level]} message` && ex === void 0).length, 1);
        expectedCount++;
      }

      if (level >= LogLevel.Warn) {
        assert.equal(messages.filter(([level, eventId, msg, ex]) => level === LogLevel.Warn && eventId === 2 && msg === `${LogLevel[level]} message` && ex === void 0).length, 1);
        expectedCount++;
      }

      if (level >= LogLevel.Error) {
        assert.equal(messages.filter(([level, eventId, msg, ex]) => level === LogLevel.Error && eventId === 3 && msg === `${LogLevel[level]} message` && ex === err).length, 1);
        expectedCount++;
      }

      assert.equal(messages.length, expectedCount);
    });
  }

  it("Log filter excludes log events", () => {
    const fakeLogger = new FakeLogger(LogLevel.Info);

    const logFilter: LogFilterCallback = (_, eventId) =>
      eventId !== 1001 && eventId !== 3001 && eventId !== 5001;

    const logger = new LoggerWrapper(fakeLogger, logFilter);

    logger.log(LogLevel.Debug, 0, "debug");
    logger.log(LogLevel.Info, 5000, "info");
    logger.log(LogLevel.Warn, 3000, "warn");
    const ex1 = Error("Error 1");
    logger.log(LogLevel.Error, 1000, "error", ex1);
    logger.log(LogLevel.Info, 5001, "info");
    logger.log(LogLevel.Warn, 3001, "warn");
    const ex2 = Error("Error 2");
    logger.log(LogLevel.Error, 1001, "error", ex2);

    assert.isFalse(fakeLogger.events.some(([level]) => level === LogLevel.Debug));

    let events = fakeLogger.events.filter(([level]) => level === LogLevel.Info);
    assert.strictEqual(events.length, 1);
    let [, eventId] = events[0];
    assert.strictEqual(eventId, 5000);

    events = fakeLogger.events.filter(([level]) => level === LogLevel.Warn);
    assert.strictEqual(events.length, 1);
    [, eventId] = events[0];
    assert.strictEqual(eventId, 3000);

    events = fakeLogger.events.filter(([level]) => level === LogLevel.Error);
    assert.strictEqual(events.length, 1);
    [, eventId] = events[0];
    const [, , , ex] = events[0];
    assert.strictEqual(eventId, 1000);
    assert.strictEqual(ex, ex1);
  });
});
