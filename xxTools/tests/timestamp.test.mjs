import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTimestamp, dateToTimestamp, relativeTime } from "../src/tools/timestamp/convert.mjs";

test("秒、毫秒和小数秒指向相同的 UTC 时间", () => {
  for (const input of ["1795694524.123", "1795694524123"]) {
    assert.equal(parseTimestamp(input).date.toISOString(), "2026-11-26T12:02:04.123Z");
  }
  assert.equal(parseTimestamp("0").date.toISOString(), "1970-01-01T00:00:00.000Z");
  assert.equal(parseTimestamp("-1").date.getTime(), -1000);
  assert.equal(parseTimestamp("1000", "milliseconds").date.getTime(), 1000);
});

test("拒绝空值、非数字和超出日期范围的时间戳", () => {
  for (const input of ["", " ", "abc", "0x10", "Infinity", "1e10", "999999999999999999"]) {
    assert.throws(() => parseTimestamp(input));
  }
});

test("本地日期转换保留毫秒，校验无效日期和闰年", () => {
  const result = dateToTimestamp("2024-02-29T12:30:45.123");
  const expected = new Date(2024, 1, 29, 12, 30, 45, 123).getTime();
  assert.deepEqual(result, { seconds: Math.floor(expected / 1000), milliseconds: expected });
  assert.equal(new Date(dateToTimestamp("0099-01-01T00:00").milliseconds).getFullYear(), 99);
  for (const input of ["", "2023-02-29T12:30", "2024-04-31T12:30", "2024-13-01T12:30", "2024-01-01T24:00"]) {
    assert.throws(() => dateToTimestamp(input));
  }
});

test("相对时间区分过去与未来", () => {
  assert.equal(relativeTime(0, 1000), "刚刚过去");
  assert.equal(relativeTime(1000, 0), "马上到来");
  assert.equal(relativeTime(0, 120000), "2 分钟前");
  assert.equal(relativeTime(7200000, 0), "2 小时后");
});
