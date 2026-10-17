import { describe, expect, it } from "vitest";
import { svgInterpolator } from "./svg-morph";

describe("numeric SVG interpolation", () => {
  it("interpolates coordinates and matrices while keeping the SVG commands", () => {
    expect(
      svgInterpolator("d", "M0 0C1 2 3 4 5 6Z", "M10 20C11 12 13 14 15 16Z")!(
        0.5,
      ),
    ).toBe("M5 10C6 7 8 9 10 11Z");
    expect(
      svgInterpolator(
        "transform",
        "matrix(1,0,0,1,0,0)",
        "matrix(0.6,0.2,-0.2,1,10,-12)",
      )!(0.5),
    ).toBe("matrix(0.8,0.1,-0.1,1,5,-6)");
    expect(svgInterpolator("d", "M0 0Z", "M0 0L1 1Z")).toBeNull();
  });
  it("retargets colors and opacity from their displayed value", () => {
    const first = svgInterpolator("fill", "#000000", "#ffffff")!(0.5);
    expect(first).toBe("#808080");
    const retargeted = svgInterpolator("fill", first, "#ff0000")!;
    expect(retargeted(0)).toBe(first);
    expect(retargeted(1)).toBe("#ff0000");
    expect(svgInterpolator("opacity", 0, 1)!(0.25)).toBe(0.25);
    expect(svgInterpolator("stroke", "url(#a)", "url(#b)")).toBeNull();
  });
});
