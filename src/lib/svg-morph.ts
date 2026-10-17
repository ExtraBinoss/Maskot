const numeric = /-?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi;
type Value = string | number;
export function svgInterpolator(
  name: string,
  from: Value,
  to: Value,
): ((progress: number) => Value) | null {
  if (typeof from === "number" && typeof to === "number")
    return (t) => from + (to - from) * t;
  if (typeof from !== "string" || typeof to !== "string") return null;
  if (name === "fill" || name === "stroke") {
    if (!/^#[a-f\d]{6}$/i.test(from) || !/^#[a-f\d]{6}$/i.test(to)) return null;
    const a = [1, 3, 5].map((i) => parseInt(from.slice(i, i + 2), 16));
    const b = [1, 3, 5].map((i) => parseInt(to.slice(i, i + 2), 16));
    return (t) =>
      "#" +
      a
        .map((v, i) =>
          Math.round(v + (b[i] - v) * t)
            .toString(16)
            .padStart(2, "0"),
        )
        .join("");
  }
  if (name !== "d" && name !== "transform") return null;
  const a = from.match(numeric)?.map(Number),
    b = to.match(numeric)?.map(Number);
  if (
    !a ||
    !b ||
    a.length !== b.length ||
    from.replace(numeric, "#") !== to.replace(numeric, "#")
  )
    return null;
  const parts = to.split(numeric);
  const precision = name === "d" ? 100 : 10000;
  // SVG numbers are interpolated directly. General complex-string mixing would
  // run CSS color detection on every coordinate of every 64-cubic path.
  return (t) => {
    let result = parts[0];
    for (let i = 0; i < b.length; i++)
      result +=
        Math.round((a[i] + (b[i] - a[i]) * t) * precision) / precision +
        parts[i + 1];
    return result;
  };
}
