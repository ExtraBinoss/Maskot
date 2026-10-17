// Frame-by-frame encoding follows Bloub's video.ts (MIT), adapted to WebM/React.
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { BeamySvg } from "./BeamySvg";
import { createMascotEngine, timelineDuration } from "./mascot-catalog";
import { serializeMascot } from "./mascot-export";
import type { MascotPreset } from "./mascot-types";

export async function mascotWebm(
  preset: MascotPreset,
  background: string,
  signal: AbortSignal,
  progress: (value: number) => void,
): Promise<Blob> {
  signal.throwIfAborted();
  if (!globalThis.VideoEncoder)
    throw new Error(
      "L’export WebM nécessite un navigateur compatible WebCodecs, comme Chrome ou Edge.",
    );
  const {
    Output,
    WebMOutputFormat,
    BufferTarget,
    CanvasSource,
    Quality,
    canEncodeVideo,
  } = await import("mediabunny");
  signal.throwIfAborted();
  const size = 1024,
    fps = 30;
  const quality = new Quality({ quantizer: 12, bitrate: 6_000_000 });
  const options = { width: size, height: size, quality };
  const codec = (await canEncodeVideo("vp9", options))
    ? "vp9"
    : (await canEncodeVideo("vp8", options))
      ? "vp8"
      : null;
  if (!codec)
    throw new Error(
      "Ce navigateur ne dispose pas d’encodeur WebM. Essaie Chrome ou Edge.",
    );
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Impossible de préparer la vidéo.");
  const output = new Output({
    format: new WebMOutputFormat(),
    target: new BufferTarget(),
  });
  const source = new CanvasSource(canvas, { codec, quality, alpha: "discard" });
  output.addVideoTrack(source, { frameRate: fps });
  const host = document.createElement("div");
  const root = createRoot(host);
  const image = new Image();
  const duration = timelineDuration(preset.timeline);
  const frames = Math.ceil(duration * fps);
  const engine = createMascotEngine(preset.look, preset.timeline[0].state);
  let step = 0,
    start = 0;
  let lastProgress = -1;
  try {
    await output.start();
    for (let i = 0; i < frames; i++) {
      signal.throwIfAborted();
      const time = i / fps;
      while (
        step < preset.timeline.length - 1 &&
        time >= start + preset.timeline[step].duration
      ) {
        start += preset.timeline[step].duration;
        step++;
        engine.setState(preset.timeline[step].state, start);
      }
      flushSync(() =>
        root.render(
          <BeamySvg
            frame={engine.sample(time)}
            color={preset.look.color}
            blush={preset.look.blush}
            paper={background}
            size={size}
          />,
        ),
      );
      const svg = host.querySelector("svg")!;
      const url = URL.createObjectURL(
        new Blob([serializeMascot(svg)], { type: "image/svg+xml" }),
      );
      try {
        image.src = url;
        await image.decode();
        signal.throwIfAborted();
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(image, 0, 0, size, size);
        await source.add(time, Math.min(1 / fps, duration - time));
      } finally {
        URL.revokeObjectURL(url);
      }
      const percent = Math.floor(((i + 1) / frames) * 100);
      if (percent !== lastProgress) {
        lastProgress = percent;
        progress(percent / 100);
      }
    }
    signal.throwIfAborted();
    source.close();
    await output.finalize();
    signal.throwIfAborted();
    if (!output.target.buffer) throw new Error("La vidéo est vide.");
    return new Blob([output.target.buffer], { type: "video/webm" });
  } catch (error) {
    if (output.state !== "finalized" && output.state !== "canceled")
      await output.cancel();
    throw error;
  } finally {
    root.unmount();
    image.src = "";
    canvas.width = canvas.height = 0;
  }
}
