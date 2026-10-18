import type { RenderedEye, StateId } from "./bot-types";
import { describe, expect, it } from "vitest";
import { BotEngine } from "./engine";
import { decalageDesYeux, POUR_TESTS } from "./eyefit";
import { EXPRESSIONS } from "./expressions";
import { DEFAULT_SHAPE, SHAPES, SHAPE_BY_ID } from "./skins";
import { STATES } from "./states";

const R = 100;
type Point = { x: number; y: number };
type Segment = { a: Point; b: Point };
type Contour = {
  points: Point[];
  segments: Segment[];
  minY: number;
  maxY: number;
  scale: number;
  bands: Segment[][];
};
const BAND_COUNT = 32;
const MAX_CONTOURS = 128;

function contourDuCorps(d: string) {
  const pts: Array<{
    x: number;
    y: number;
  }> = [];
  for (const seg of d.slice(1).split("C")) {
    const n = seg.match(/-?\d+\.?\d*/g)?.map(Number) ?? [];
    if (n.length >= 6) pts.push({ x: n[4]!, y: n[5]! });
    else if (n.length === 2) pts.push({ x: n[0]!, y: n[1]! });
  }
  return pts;
}

function prepareContour(path: string): Contour {
  const points = contourDuCorps(path);
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const scale = maxY > minY ? BAND_COUNT / (maxY - minY) : 0;
  const bands = Array.from({ length: BAND_COUNT }, () => [] as Segment[]);
  const segments = points.map((a, index) => ({
    a,
    b: points[(index + points.length - 1) % points.length],
  }));
  for (const segment of segments) {
    const start = Math.max(
      0,
      Math.floor((Math.min(segment.a.y, segment.b.y) - minY) * scale),
    );
    const end = Math.min(
      BAND_COUNT - 1,
      Math.floor((Math.max(segment.a.y, segment.b.y) - minY) * scale),
    );
    for (let band = start; band <= end; band++) bands[band].push(segment);
  }
  return { points, segments, minY, maxY, scale, bands };
}

function raycast(segments: Segment[], x: number, y: number) {
  let on = false;
  for (const { a, b } of segments) {
    if (
      a.y > y !== b.y > y &&
      x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x
    )
      on = !on;
  }
  return on;
}

function dedans(contour: Contour, x: number, y: number) {
  if (y < contour.minY || y >= contour.maxY) return false;
  const band = Math.min(
    BAND_COUNT - 1,
    Math.floor((y - contour.minY) * contour.scale),
  );
  return raycast(contour.bands[band], x, y);
}

function contourDeLOeil(eye: RenderedEye, N = 32) {
  const g = eye.d.match(/-?\d+\.?\d*/g)!.map(Number);
  const hw = Math.abs(g[0]!);
  const r = Math.abs(g[2]!);
  const droit = Math.abs(g[1]!);
  const m = eye.matrix.match(/-?\d+\.?\d*/g)!.map(Number);
  const [a, b, c, d, e, f] = m as [
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  const out: Array<{
    x: number;
    y: number;
  }> = [];
  for (let i = 0; i < N; i++) {
    const u = (i / N) * 4;
    let x: number;
    let y: number;
    if (u < 1) {
      const t = Math.PI * (u - 0.5);
      x = Math.cos(t) * r;
      y = -droit + Math.sin(t) * r;
    } else if (u < 2) {
      x = hw;
      y = -droit + (u - 1) * 2 * droit;
    } else if (u < 3) {
      const t = Math.PI * (u - 2 + 0.5);
      x = Math.cos(t) * r;
      y = droit + Math.sin(t) * r;
    } else {
      x = -hw;
      y = droit - (u - 3) * 2 * droit;
    }
    out.push({ x: a * x + c * y + e, y: b * x + d * y + f });
  }
  return out;
}

const INSTANTS = 60;
const PAS = 1 / 20;

function debordement(
  state: StateId,
  radii: number[],
  expr: (typeof EXPRESSIONS)[number] | null,
  contours: Map<string, Contour>,
) {
  const e = new BotEngine(R, state, radii, expr);
  let pire = 0;
  for (let i = 0; i < INSTANTS; i++) {
    const f = e.sample(i * PAS);
    let corps = contours.get(f.bodyPath);
    if (!corps) {
      corps = prepareContour(f.bodyPath);
      if (contours.size >= MAX_CONTOURS)
        contours.delete(contours.keys().next().value!);
      contours.set(f.bodyPath, corps);
    }
    for (const eye of f.eyes) {
      for (const p of contourDeLOeil(eye)) {
        if (dedans(corps, p.x, p.y)) continue;
        let distance = Infinity;
        for (const q of corps.points)
          distance = Math.min(distance, Math.hypot(q.x - p.x, q.y - p.y));
        pire = Math.max(pire, distance);
      }
    }
  }
  return pire;
}

const CORPS_DE_BASE = STATES.filter((s) => s.baseBody).map((s) => s.id);

const SILHOUETTE_MESUREE = STATES.filter((s) => !s.baseBody).map((s) => s.id);
describe("formes du personnalisateur", () => {
  it("le classement par bandes conserve le raycasting complet, y compris aux bords", () => {
    const differences: string[] = [];
    for (const forme of SHAPES) {
      const contour = prepareContour(
        new BotEngine(R, "idle", forme.radii, null).sample(0.7).bodyPath,
      );
      const probes = [...contour.points];
      for (let y = -140; y <= 140; y += 7)
        for (let x = -140; x <= 140; x += 7) probes.push({ x, y });
      for (let band = 0; band <= BAND_COUNT; band++) {
        const y = contour.minY + band / contour.scale;
        for (const offset of [-1e-8, 0, 1e-8])
          for (const x of [-100, -30, 0, 30, 100])
            probes.push({ x, y: y + offset });
      }
      for (const { x, y } of probes)
        if (dedans(contour, x, y) !== raycast(contour.segments, x, y))
          differences.push(`${forme.id}/${x}/${y}`);
    }
    expect(differences).toEqual([]);
  });
  // Every state × shape × expression, 60 instants and both complete eye contours.
  // Only repeated contour parsing and impossible ray intersections are skipped.
  it("aucune forme ne laisse un oeil sortir de la silhouette", () => {
    const fautifs: string[] = [];
    for (const state of CORPS_DE_BASE) {
      for (const forme of SHAPES) {
        const contours = new Map<string, Contour>();
        for (const expr of [null, ...EXPRESSIONS]) {
          const sortie = debordement(state, forme.radii, expr, contours);
          if (sortie > 0.05) {
            fautifs.push(
              `${state}/${forme.id}/${expr?.id ?? "pose"} ${sortie.toFixed(1)}`,
            );
          }
        }
      }
    }
    // Cinq couples etat x forme debordaient : `wide`+`capsule` de 14,5 unites sur une boule
    // de rayon 100, `wide`+`triangle` de 11,9, `idle`+`capsule` et `swirl`+`capsule` de 5,3,
    // `notify`+`goutte` de 3,3.
    expect(fautifs).toEqual([]);
  }, 180000);

  it("choisir le cercle rend exactement la meme chose que ne rien choisir", () => {
    expect(DEFAULT_SHAPE).toBe("cercle");
    const cercle = SHAPE_BY_ID.get("cercle")!.radii;
    for (const state of CORPS_DE_BASE) {
      for (const expr of [null, ...EXPRESSIONS]) {
        const avec = new BotEngine(R, state, cercle, expr).sample(1);
        const sans = new BotEngine(R, state, null, expr).sample(1);
        expect(avec.eyes, `${state}/${expr?.id ?? "pose"}`).toEqual(sans.eyes);
      }
      expect(decalageDesYeux(cercle, state, null)).toEqual({ x: 0, y: 0 });
    }
  });

  it("la forme choisie ne touche pas aux etats a silhouette mesuree", () => {
    for (const state of SILHOUETTE_MESUREE) {
      const nu = new BotEngine(R, state, null, null).sample(1);
      for (const forme of SHAPES) {
        const habille = new BotEngine(R, state, forme.radii, null).sample(1);
        expect(habille.eyes, `${state}/${forme.id}`).toEqual(nu.eyes);
        expect(habille.bodyPath).toBe(nu.bodyPath);
      }
    }
  });

  it("la taille des yeux ne depend pas de la forme", () => {
    const tailles = new Set(
      SHAPES.map((f) =>
        new BotEngine(R, "idle", f.radii, null)
          .sample(1)
          .eyes.map((y) => y.d)
          .join("|"),
      ),
    );
    expect(tailles.size).toBe(1);
  });

  it("la correction ne fait pas osciller les yeux", () => {
    const pas = 1 / 60;
    const trajectoire = (
      bâti: () => BotEngine,
      duree = BotEngine.SHAPE_MORPH,
    ) => {
      const e = bâti();
      const out: Array<
        Array<{
          x: number;
          y: number;
        }>
      > = [];
      for (let t = 0; t <= duree + pas; t += pas) {
        out.push(
          e.sample(t).eyes.map((eye) => {
            const n = eye.matrix.match(/-?\d+\.?\d*/g)!.map(Number);
            return { x: n[4]!, y: n[5]! };
          }),
        );
      }
      return out;
    };

    const allersRetours = (
      suite: Array<
        Array<{
          x: number;
          y: number;
        }>
      >,
    ) => {
      let n = 0;
      let amplitude = 0;
      const yeux = Math.min(...suite.map((f) => f.length));
      for (let j = 0; j < yeux; j++) {
        let px = 0;
        let py = 0;
        for (let i = 1; i < suite.length; i++) {
          const dx = suite[i]![j]!.x - suite[i - 1]![j]!.x;
          const dy = suite[i]![j]!.y - suite[i - 1]![j]!.y;
          const len = Math.hypot(dx, dy);
          if (len <= 0.05) continue;
          if ((px || py) && dx * px + dy * py < 0) {
            n++;
            amplitude = Math.max(amplitude, len);
          }
          px = dx;
          py = dy;
        }
      }
      return { n, amplitude };
    };
    const cercle = SHAPE_BY_ID.get("cercle")!.radii;
    const morphDeForme = (radii: number[]) =>
      allersRetours(
        trajectoire(() => {
          const e = new BotEngine(R, "idle", cercle, null);
          e.setShape(radii, 0);
          return e;
        }),
      );
    const auRepos = (radii: number[]) =>
      allersRetours(
        trajectoire(() => new BotEngine(R, "idle", radii, null), 3),
      );
    const morphsDExpression = (radii: number[]) =>
      EXPRESSIONS.map((expr) =>
        allersRetours(
          trajectoire(() => {
            const e = new BotEngine(R, "idle", radii, EXPRESSIONS[0]!);
            e.setExpression(expr, 0);
            return e;
          }),
        ),
      ).reduce(
        (a, b) => ({
          n: a.n + b.n,
          amplitude: Math.max(a.amplitude, b.amplitude),
        }),
        {
          n: 0,
          amplitude: 0,
        },
      );
    /*
     * Sur le CERCLE, rien du tout : la correction y est nulle, donc elle ne peut ajouter
     * aucun mouvement, et c'est la reference des trois comparaisons.
     */
    expect(morphsDExpression(cercle).n, "cercle : morphs d expression").toBe(0);
    for (const forme of SHAPES) {
      // Compare the corrected shape with the same radial profile without the fit table.
      // Concave silhouettes naturally change the projected eye trajectory.
      // Au repos, la seule chose qui bouge est la derive du regard. Une correction qui la
      // suivrait ferait trembler les yeux en permanence : c'est le defaut le plus visible
      // de tous, et le premier qu'on a eu.
      expect(
        auRepos(forme.radii).n,
        `${forme.id} : derive au repos`,
      ).toBeLessThanOrEqual(auRepos([...forme.radii]).n + 1);
      // Un changement de forme fait bouger le decalage, mais sur la meme courbe que la
      // silhouette : aucun aller-retour de plus que le cercle.
      expect(
        morphDeForme(forme.radii).n,
        `morph de forme vers ${forme.id}`,
      ).toBeLessThanOrEqual(morphDeForme(cercle).n + 1);
      /*
       * Un changement d'expression fait passer le decalage d'une entree de table a l'autre.
       * Sept formes sur huit n'y gagnent aucun aller-retour ; la `goutte` passe de un
       * rebroussement de 6,3 unites — deja present sans correction — a deux de 11,1. La
       * borne laisse passer ca et rien de plus : les versions fautives etaient a 26.
       */
      expect(
        morphsDExpression(forme.radii).amplitude,
        `${forme.id} : morphs d expression`,
      ).toBeLessThan(14);
    }
  }, 30000);

  it("la table reconstruite conserve les corrections déterministes", () => {
    const rebuilt = POUR_TESTS.batir();
    expect(rebuilt.size).toBe(SHAPES.length);
    for (const shape of SHAPES) {
      for (const expression of EXPRESSIONS) {
        expect(rebuilt.get(shape.radii)?.get(`idle|${expression.id}`)).toEqual(
          decalageDesYeux(shape.radii, "idle", expression.id),
        );
      }
    }
  });
});
