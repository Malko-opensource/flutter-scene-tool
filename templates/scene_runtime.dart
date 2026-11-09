// Generated runtime. Extend user-owned widgets instead of editing this file.
import 'dart:math' as math;
import 'package:flutter/material.dart';

double _number(dynamic value) => (value as num).toDouble();
double _unit(double value) => value.clamp(0.0, 1.0).toDouble();
Offset _point(List<dynamic> values) => Offset(_number(values[0]), _number(values[1]));
Color _color(String value) => Color(0xff000000 | int.parse(value.substring(1), radix: 16));
bool _systemReducedMotion(BuildContext context) =>
  MediaQuery.maybeOf(context)?.disableAnimations == true ||
  WidgetsBinding.instance.platformDispatcher.accessibilityFeatures.reduceMotion;

@immutable
class SceneAsset {
  const SceneAsset(this.path, this.width);
  final String path;
  final int width;
  ImageProvider<Object> get provider => ResizeImage.resizeIfNeeded(
    math.min(width, 2048), null, AssetImage(path),
  );
}

@immutable
class SceneLayer {
  const SceneLayer({required this.id, required this.kind, required this.bounds,
    required this.anchor, required this.color, required this.start,
    required this.end, required this.offset, required this.initialScale,
    required this.initialOpacity, required this.pointerDepth,
    required this.scrollScale, required this.semantics, this.asset});
  factory SceneLayer.fromJson(Map<String, dynamic> data) {
    final bounds = data['bounds'] as List<dynamic>;
    final entry = data['entry'] as Map<String, dynamic>;
    final depth = data['depth'] as Map<String, dynamic>;
    return SceneLayer(
      id: data['id'] as String, kind: data['kind'] as String,
      bounds: Rect.fromLTWH(_number(bounds[0]), _number(bounds[1]), _number(bounds[2]), _number(bounds[3])),
      anchor: _point(data['anchor'] as List<dynamic>), color: _color(data['color'] as String),
      start: _number(entry['start']), end: _number(entry['end']),
      offset: _point(entry['offset'] as List<dynamic>), initialScale: _number(entry['scale']),
      initialOpacity: _number(entry['opacity']), pointerDepth: _number(depth['pointer']),
      scrollScale: _number(depth['scrollScale']), semantics: data['semantics'] as String,
      asset: data['asset'] as String?,
    );
  }
  final String id, kind, semantics;
  final String? asset;
  final Rect bounds;
  final Offset anchor, offset;
  final Color color;
  final double start, end, initialScale, initialOpacity, pointerDepth, scrollScale;
}

@immutable
class SceneSpec {
  const SceneSpec({required this.id, required this.label, required this.size,
    required this.cover, required this.background, required this.focalPoint,
    required this.duration, required this.layers, required this.assets});
  // Accept only documents already validated by the CLI contract.
  factory SceneSpec.fromJson(Map<String, dynamic> data) {
    final canvas = data['canvas'] as Map<String, dynamic>;
    return SceneSpec(
      id: data['id'] as String, label: data['label'] as String,
      size: Size(_number(canvas['width']), _number(canvas['height'])),
      cover: canvas['fit'] == 'cover', background: _color(canvas['background'] as String),
      focalPoint: _point(canvas['focalPoint'] as List<dynamic>),
      duration: Duration(milliseconds: (data['motion'] as Map<String, dynamic>)['durationMs'] as int),
      layers: List<SceneLayer>.unmodifiable((data['layers'] as List<dynamic>).map((value) => SceneLayer.fromJson(value as Map<String, dynamic>))),
      assets: Map<String, SceneAsset>.unmodifiable({
        for (final value in data['assets'] as List<dynamic>)
          (value as Map<String, dynamic>)['id'] as String: SceneAsset(value['path'] as String, value['width'] as int),
      }),
    );
  }
  final String id, label;
  final Size size;
  final bool cover;
  final Color background;
  final Offset focalPoint;
  final Duration duration;
  final List<SceneLayer> layers;
  final Map<String, SceneAsset> assets;
}

@immutable
class SceneFrame {
  const SceneFrame(this.offset, this.scale, this.opacity);
  final Offset offset;
  final double scale, opacity;
}

SceneFrame sampleLayer(SceneLayer layer, double progress, {
  Offset pointer = Offset.zero, double scrollProgress = 0, bool reducedMotion = false,
}) {
  if (reducedMotion) return const SceneFrame(Offset.zero, 1, 1);
  final p = _unit((_unit(progress) - layer.start) / (layer.end - layer.start));
  final ease = 1 - math.pow(1 - p, 3).toDouble();
  final pointerOffset = Offset(pointer.dx.clamp(-1.0, 1.0).toDouble(), pointer.dy.clamp(-1.0, 1.0).toDouble()) * layer.pointerDepth;
  return SceneFrame(
    layer.offset * (1 - ease) + pointerOffset,
    (1 + (layer.initialScale - 1) * (1 - ease)) * (1 + _unit(scrollProgress) * layer.scrollScale),
    layer.initialOpacity + (1 - layer.initialOpacity) * ease,
  );
}

/// Stateless, seekable stage: the caller owns progress and input mapping.
/// Translations are in source-stage fractions, not individual-piece fractions.
class SceneStage extends StatelessWidget {
  const SceneStage({super.key, required this.scene, required this.progress,
    this.pointer = Offset.zero, this.scrollProgress = 0, this.reducedMotion = false});
  final SceneSpec scene;
  final double progress, scrollProgress;
  final Offset pointer;
  final bool reducedMotion;
  @override
  Widget build(BuildContext context) => LayoutBuilder(builder: (context, constraints) {
    final viewport = constraints.biggest;
    final sx = viewport.width / scene.size.width;
    final sy = viewport.height / scene.size.height;
    final ratio = scene.cover ? math.max(sx, sy) : math.min(sx, sy);
    final stage = Size(scene.size.width * ratio, scene.size.height * ratio);
    final origin = Offset((viewport.width - stage.width) * scene.focalPoint.dx, (viewport.height - stage.height) * scene.focalPoint.dy);
    final reduce = reducedMotion || _systemReducedMotion(context);
    return ColoredBox(color: scene.background, child: ClipRect(child: Semantics(
      label: scene.label,
      child: Stack(fit: StackFit.expand, children: [
        for (final layer in scene.layers)
          _positionedLayer(layer, stage, origin, reduce),
      ]),
    )));
  });

  Widget _positionedLayer(SceneLayer layer, Size stage, Offset origin, bool reduce) {
    final frame = sampleLayer(layer, progress, pointer: pointer, scrollProgress: scrollProgress, reducedMotion: reduce);
    final Widget content;
    if (layer.kind == 'image') {
      content = Image(image: scene.assets[layer.asset]!.provider, fit: BoxFit.fill,
        excludeFromSemantics: true, filterQuality: FilterQuality.medium);
    } else {
      content = DecoratedBox(decoration: BoxDecoration(color: layer.color,
        shape: layer.kind == 'ellipse' ? BoxShape.circle : BoxShape.rectangle));
      // Ellipses are painted using a dedicated painter to support non-square bounds.
    }
    final painted = layer.kind == 'ellipse'
      ? CustomPaint(painter: _EllipsePainter(layer.color)) : content;
    final semantic = layer.semantics.isEmpty ? ExcludeSemantics(child: painted)
      : Semantics(label: layer.semantics, image: true, child: ExcludeSemantics(child: painted));
    return Positioned(key: ValueKey(layer.id),
      left: origin.dx + (layer.bounds.left + frame.offset.dx) * stage.width,
      top: origin.dy + (layer.bounds.top + frame.offset.dy) * stage.height,
      width: layer.bounds.width * stage.width, height: layer.bounds.height * stage.height,
      child: Transform.scale(scale: frame.scale,
        alignment: Alignment(layer.anchor.dx * 2 - 1, layer.anchor.dy * 2 - 1),
        child: Opacity(opacity: frame.opacity, child: RepaintBoundary(child: semantic))),
    );
  }
}

class _EllipsePainter extends CustomPainter {
  const _EllipsePainter(this.color);
  final Color color;
  @override
  void paint(Canvas canvas, Size size) => canvas.drawOval(Offset.zero & size, Paint()..color = color);
  @override
  bool shouldRepaint(_EllipsePainter oldDelegate) => oldDelegate.color != color;
}

/// One entry clock. Asset readiness and generation tokens prevent stale commits.
/// No routes, text layout, gesture ownership, shaders, or network are hidden here.
class ScenePlayer extends StatefulWidget {
  const ScenePlayer({super.key, required this.scene, this.reducedMotion = false,
    this.pointer = Offset.zero, this.scrollProgress = 0, this.onError, this.prepareScene});
  final SceneSpec scene;
  final bool reducedMotion;
  final Offset pointer;
  final double scrollProgress;
  final ValueChanged<Object>? onError;
  /// Optional integration/testing hook. Complete only when target assets are ready.
  /// Failures retain the last committed scene; stale completions are ignored.
  final Future<void> Function(SceneSpec scene, BuildContext context)? prepareScene;
  @override
  State<ScenePlayer> createState() => _ScenePlayerState();
}

class _ScenePlayerState extends State<ScenePlayer> with SingleTickerProviderStateMixin, WidgetsBindingObserver {
  late final AnimationController _clock;
  SceneSpec? _current, _target;
  int _generation = 0;
  Object? _error;
  bool get _reduce => widget.reducedMotion || _systemReducedMotion(context);
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _clock = AnimationController(vsync: this, duration: widget.scene.duration);
  }
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!identical(_target, widget.scene)) _prepare(widget.scene);
    if (_reduce) _clock.value = 1;
  }
  @override
  void didUpdateWidget(ScenePlayer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!identical(_target, widget.scene)) _prepare(widget.scene);
    if (_reduce) _clock.value = 1;
  }
  @override
  void didChangeAccessibilityFeatures() {
    if (!mounted) return;
    setState(() {});
    if (_reduce) _clock.value = 1;
  }
  Future<void> _prepare(SceneSpec target) async {
    _target = target;
    final generation = ++_generation;
    try {
      if (widget.prepareScene case final prepare?) {
        await prepare(target, context);
      } else {
        // Sequential decode bounds peak simultaneous work. The displayed scene
        // remains mounted while a new target prepares.
        for (final asset in target.assets.values) {
          Object? failure;
          await precacheImage(asset.provider, context, onError: (error, stack) { failure = error; });
          if (!mounted || generation != _generation) return;
          if (failure != null) throw failure!;
        }
      }
      if (!mounted || generation != _generation) return;
      setState(() { _current = target; _error = null; });
      _clock.duration = target.duration;
      if (_reduce) { _clock.value = 1; } else { _clock.forward(from: 0); }
    } catch (error) {
      if (!mounted || generation != _generation) return;
      setState(() { _error = error; });
      widget.onError?.call(error);
    }
  }
  @override
  void dispose() { WidgetsBinding.instance.removeObserver(this); _generation++; _clock.dispose(); super.dispose(); }
  @override
  Widget build(BuildContext context) => Stack(fit: StackFit.expand, children: [
    if (_current case final scene?)
      AnimatedBuilder(animation: _clock, builder: (context, child) => SceneStage(
        scene: scene, progress: _clock.value, pointer: widget.pointer,
        scrollProgress: widget.scrollProgress, reducedMotion: _reduce,
      ))
    else ColoredBox(color: widget.scene.background),
    if (_error != null) Align(alignment: Alignment.bottomCenter, child: SafeArea(
      child: Material(color: Colors.black87, child: TextButton(
        onPressed: () => _prepare(widget.scene),
        child: const Text('Scene could not load. Retry', style: TextStyle(color: Colors.white)),
      )),
    )),
  ]);
}
