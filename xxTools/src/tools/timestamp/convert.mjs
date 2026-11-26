export function parseTimestamp(input, unit = "auto") {
  const text = String(input).trim();
  if (!/^[+-]?\d+(?:\.\d+)?$/.test(text)) {
    throw new Error("请输入有效的数字时间戳。");
  }
  const value = Number(text);
  const resolvedUnit = unit === "auto"
    ? (Math.abs(value) >= 1e11 ? "milliseconds" : "seconds")
    : unit;
  const milliseconds = resolvedUnit === "seconds" ? value * 1000 : value;
  const date = new Date(milliseconds);
  if (!Number.isFinite(milliseconds) || Number.isNaN(date.getTime())) {
    throw new Error("时间戳超出可转换的日期范围。");
  }
  return { date, unit: resolvedUnit };
}

export function dateToTimestamp(input) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(input);
  if (!match) throw new Error("请选择完整的本地日期和时间。");
  const [, year, month, day, hour, minute, second = "0", fraction = "0"] = match;
  const parts = [Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second), Number(fraction.padEnd(3, "0"))];
  const date = new Date(0);
  date.setFullYear(parts[0], parts[1], parts[2]);
  date.setHours(parts[3], parts[4], parts[5], parts[6]);
  const actual = [date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()];
  if (parts.some((part, index) => part !== actual[index])) {
    throw new Error("日期或时间无效，请检查输入（包括夏令时跳过的时刻）。");
  }
  return { seconds: Math.floor(date.getTime() / 1000), milliseconds: date.getTime() };
}

export function relativeTime(milliseconds, now = Date.now()) {
  const difference = milliseconds - now;
  const seconds = Math.abs(difference) / 1000;
  if (seconds < 10) return difference > 0 ? "马上到来" : "刚刚过去";
  const [size, label] = seconds < 60 ? [1, "秒"]
    : seconds < 3600 ? [60, "分钟"]
    : seconds < 86400 ? [3600, "小时"] : [86400, "天"];
  return `${Math.floor(seconds / size)} ${label}${difference > 0 ? "后" : "前"}`;
}
