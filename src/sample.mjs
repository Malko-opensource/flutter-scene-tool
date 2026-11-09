const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));
export function sampleLayer(layer, progress, { pointer = [0, 0], scroll = 0, reduced = false } = {}) {
  if (reduced) return { offset: [0, 0], scale: 1, opacity: 1 };
  const p = clamp((clamp(progress) - layer.entry.start) / (layer.entry.end - layer.entry.start));
  const ease = 1 - (1 - p) ** 3;
  return {
    offset: layer.entry.offset.map((n, i) => n * (1 - ease) + clamp(pointer[i], -1, 1) * layer.depth.pointer),
    scale: (1 + (layer.entry.scale - 1) * (1 - ease)) * (1 + clamp(scroll) * layer.depth.scrollScale),
    opacity: layer.entry.opacity + (1 - layer.entry.opacity) * ease,
  };
}
export function sampleScene(scene, progress, options = {}) {
  return { progress, reduced: options.reduced ?? false, layers: scene.layers.map(layer => ({ id: layer.id, ...sampleLayer(layer, progress, options) })) };
}
