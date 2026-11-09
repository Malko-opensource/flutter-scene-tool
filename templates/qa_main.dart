// Generated, development-only QA entry point. Not the production app shell.
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'scene_data.dart';
import 'scene_runtime.dart';

void main() => runApp(const MaterialApp(
  debugShowCheckedModeBanner: false,
  home: SceneQaHarness(),
));

/// Real controls for deterministic inspection and interrupted-readiness tests.
/// Injected readiness failures/delays are explicitly test-only behavior.
class SceneQaHarness extends StatefulWidget {
  const SceneQaHarness({super.key});
  @override
  State<SceneQaHarness> createState() => _SceneQaHarnessState();
}

class _SceneQaHarnessState extends State<SceneQaHarness> {
  late final List<SceneSpec> _scenes;
  int _selected = 0, _replay = 0, _delayMs = 0;
  bool _inspector = true, _manual = false, _reduced = false, _failNext = false;
  double _progress = 1;
  String _lastError = 'None';

  @override
  void initState() {
    super.initState();
    _scenes = [
      _variant('A', const Color(0xffe9dfca)),
      _variant('B', const Color(0xffc3dce9)),
      _variant('C', const Color(0xffe8c9d5)),
    ];
  }

  SceneSpec _variant(String suffix, Color color) => SceneSpec(
    id: '${generatedScene.id}_$suffix', label: 'QA scene $suffix',
    size: generatedScene.size, cover: generatedScene.cover,
    background: color, focalPoint: generatedScene.focalPoint,
    duration: generatedScene.duration, assets: generatedScene.assets,
    layers: generatedScene.layers.map((layer) => SceneLayer(
      id: layer.id, kind: layer.kind, bounds: layer.bounds, anchor: layer.anchor,
      color: layer.id == generatedScene.layers.first.id && layer.kind != 'image' ? color : layer.color,
      start: layer.start, end: layer.end, offset: layer.offset,
      initialScale: layer.initialScale, initialOpacity: layer.initialOpacity,
      pointerDepth: layer.pointerDepth, scrollScale: layer.scrollScale,
      semantics: layer.semantics, asset: layer.asset,
    )).toList(growable: false),
  );

  void _select(int index) => setState(() { _selected = index; _manual = false; });
  void _restart() => setState(() { _replay++; _manual = false; });

  Future<void> _prepare(SceneSpec scene, BuildContext context) async {
    final fail = _failNext;
    _failNext = false;
    await Future<void>.delayed(Duration(milliseconds: _delayMs));
    if (!context.mounted) return;
    if (fail) throw StateError('Injected QA readiness failure');
    for (final asset in scene.assets.values) {
      Object? failure;
      await precacheImage(asset.provider, context, onError: (error, stack) { failure = error; });
      if (!context.mounted) return;
      if (failure != null) throw failure!;
    }
  }

  @override
  Widget build(BuildContext context) => CallbackShortcuts(
    bindings: {
      const SingleActivator(LogicalKeyboardKey.keyA): () => _select(0),
      const SingleActivator(LogicalKeyboardKey.keyB): () => _select(1),
      const SingleActivator(LogicalKeyboardKey.keyC): () => _select(2),
      const SingleActivator(LogicalKeyboardKey.keyR): _restart,
      const SingleActivator(LogicalKeyboardKey.keyI): () => setState(() { _inspector = !_inspector; }),
    },
    child: Focus(autofocus: true, child: Scaffold(body: LayoutBuilder(
      builder: (context, box) => Stack(fit: StackFit.expand, children: [
        if (_manual)
          SceneStage(scene: _scenes[_selected], progress: _progress, reducedMotion: _reduced)
        else
          ScenePlayer(key: ValueKey(_replay), scene: _scenes[_selected],
            reducedMotion: _reduced, prepareScene: _prepare,
            onError: (error) { if (mounted) setState(() { _lastError = error.toString(); }); }),
        Positioned(top: 12, right: 12, child: SafeArea(child: IconButton.filled(
          tooltip: _inspector ? 'Hide QA inspector' : 'Show QA inspector',
          onPressed: () => setState(() { _inspector = !_inspector; }),
          icon: const Icon(Icons.tune),
        ))),
        if (_inspector) Align(alignment: Alignment.bottomCenter, child: SafeArea(child:
          ConstrainedBox(constraints: BoxConstraints(maxWidth: 600, maxHeight: box.maxHeight * 0.7),
            child: Card(margin: const EdgeInsets.all(12), child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('QA harness · test controls', style: TextStyle(fontWeight: FontWeight.bold)),
                Text('Requested: ${_scenes[_selected].label} · ${_manual ? 'manual frame' : 'player'}'),
                const Text('A/B/C select · R replay · I hide inspector'),
                const SizedBox(height: 8),
                Wrap(spacing: 8, runSpacing: 8, children: [
                  for (var i = 0; i < _scenes.length; i++)
                    FilledButton(onPressed: () => _select(i), child: Text('Scene ${String.fromCharCode(65 + i)}')),
                  OutlinedButton(onPressed: _restart, child: const Text('Replay')),
                ]),
                SwitchListTile(contentPadding: EdgeInsets.zero, title: const Text('Manual timeline'),
                  value: _manual, onChanged: (value) => setState(() { _manual = value; })),
                Text('Frame progress: ${(_progress * 100).round()}%'),
                SliderTheme(data: SliderTheme.of(context).copyWith(showValueIndicator: ShowValueIndicator.never),
                  child: Slider(value: _progress, min: 0, max: 1, divisions: 100,
                    label: '${(_progress * 100).round()}%',
                    onChanged: _manual ? (value) => setState(() { _progress = value; }) : null)),
                CheckboxListTile(contentPadding: EdgeInsets.zero, title: const Text('Reduced motion override'),
                  value: _reduced, onChanged: (value) => setState(() { _reduced = value ?? false; })),
                Wrap(spacing: 8, runSpacing: 8, children: [
                  OutlinedButton(onPressed: () => setState(() { _delayMs = _delayMs == 0 ? 1000 : 0; }),
                    child: Text('Readiness delay: ${_delayMs}ms')),
                  OutlinedButton(onPressed: () => setState(() { _failNext = true; }),
                    child: Text(_failNext ? 'Failure armed' : 'Fail next load')),
                ]),
                const SizedBox(height: 8),
                Text('Last preparation error: $_lastError'),
                const Text('Delay and failure are injected test behavior. This is not the production app.'),
              ]),
            )),
          ),
        )),
      ]),
    ))),
  );
}
