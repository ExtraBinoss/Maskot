import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BeamySvg } from "./BeamySvg";
import { createMascotEngine, DEFAULT_LOOK } from "./mascot-catalog";
import { serializeMascot } from "./mascot-export";
import { SEQUENCE } from "./engine/states";

describe("React SVG renderer", () => {
  it("isolates SVG definitions and references across instances", () => {
    const frame = createMascotEngine(DEFAULT_LOOK, "swirl").sample(1.2);
    const { container } = render(
      <>
        <BeamySvg frame={frame} color="#ff5a1f" />
        <BeamySvg frame={frame} color="#3b93f0" blush />
      </>,
    );
    const ids = [...container.querySelectorAll("[id]")].map(
      (element) => element.id,
    );
    expect(new Set(ids).size).toBe(ids.length);
    for (const svg of container.querySelectorAll("svg")) {
      const text = serializeMascot(svg);
      for (const [, id] of text.matchAll(/url\(#([^)]+)\)/g))
        expect(svg.querySelector(`[id="${id}"]`)).not.toBeNull();
      expect(text).not.toMatch(/NaN|Infinity|var\(--/);
    }
  });
  it.each(SEQUENCE)("renders %s as standalone artwork", (state) => {
    const frame = createMascotEngine(DEFAULT_LOOK, state).sample(1.2);
    const { container } = render(
      <BeamySvg frame={frame} color={DEFAULT_LOOK.color} blush />,
    );
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("role")).toBe("img");
    const document = new DOMParser().parseFromString(
      serializeMascot(svg),
      "image/svg+xml",
    );
    expect(document.querySelector("parsererror")).toBeNull();
    expect(document.querySelector("path")).not.toBeNull();
  });
});
