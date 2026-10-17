import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as catalog from "../mascot/mascot-catalog";
import { defaultPreset } from "../mascot/mascot-storage";
import { MascotThumbnail } from "./MascotThumbnail";

describe("preview sampling", () => {
  it("reuses geometry for paint edits and resamples when the eye style changes", () => {
    const create = vi.spyOn(catalog, "createMascotEngine");
    const look = defaultPreset().look;
    const { container, rerender } = render(<MascotThumbnail look={look} />);
    const before = container.innerHTML;
    rerender(
      <MascotThumbnail
        look={{ ...look, color: "#123456", blush: !look.blush }}
      />,
    );
    expect(create).toHaveBeenCalledTimes(1);
    expect(container.innerHTML).not.toBe(before);
    expect(container.innerHTML).toContain("#123456");
    const painted = container.innerHTML;
    rerender(<MascotThumbnail look={{ ...look, eyes: "star" }} />);
    expect(create).toHaveBeenCalledTimes(2);
    expect(container.innerHTML).not.toBe(painted);
  });
});
