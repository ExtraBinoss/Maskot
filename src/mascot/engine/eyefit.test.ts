import { expect, it } from "vitest";
import { SHAPES } from "./skins";
import { POUR_TESTS } from "./eyefit";
import EYE_FIT_DATA from "./eye-fit-data";

it("precomputed eye fits match the original solver for every built-in pose", () => {
  const solved = POUR_TESTS.batir();
  const expected = Object.fromEntries(
    SHAPES.map((shape) => [
      shape.id,
      Object.fromEntries(solved.get(shape.radii)!),
    ]),
  );
  expect(EYE_FIT_DATA).toEqual(expected);
});
