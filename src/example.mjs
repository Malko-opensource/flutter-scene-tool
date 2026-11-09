const layer = (id, role, kind, bounds, color, start, end, offset, scale, pointer) => ({
  id, role, kind, bounds, anchor: [0.5, 1], color,
  entry: { start, end, offset, scale, opacity: role === 'background' ? 1 : 0 },
  depth: { pointer, scrollScale: 0 }, semantics: '',
});
export const example = {
  schemaVersion: 1, id: 'quiet_landscape', label: 'An abstract layered landscape',
  canvas: { width: 1200, height: 900, fit: 'cover', background: '#e9dfca', focalPoint: [0.7, 0.15] },
  motion: { durationMs: 1400, reducedMotion: 'settle' }, assets: [],
  layers: [
    layer('sky', 'background', 'rectangle', [0, 0, 1, 1], '#e9dfca', 0, 0.3, [0, 0], 1, 0),
    layer('sun', 'detail', 'ellipse', [0.65, 0.12, 0.14, 0.19], '#dd8959', 0.05, 0.6, [0, 0.06], 0.95, 0.005),
    layer('far_hill', 'landmark', 'ellipse', [-0.2, 0.5, 1.1, 1.1], '#677e72', 0.12, 0.7, [0, 0.12], 0.98, 0.01),
    layer('near_hill', 'foreground', 'ellipse', [0.35, 0.65, 1, 0.8], '#384f4e', 0.35, 0.9, [-0.03, 0.1], 1.02, 0.018),
  ],
};
