import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import '../lib/generated/scene_data.dart';
import '../lib/generated/scene_runtime.dart';
import '../lib/generated/qa_main.dart' as qa;

void main() {
  SceneSpec named(String id) => SceneSpec(
    id: id, label: id, size: generatedScene.size, cover: generatedScene.cover,
    background: generatedScene.background, focalPoint: generatedScene.focalPoint,
    duration: generatedScene.duration, layers: generatedScene.layers, assets: generatedScene.assets,
  );
  test('Dart frame sampling matches the CLI contract fixtures', () {
    final fixtures = jsonDecode(File('test/fixtures/scene_motion_samples.json').readAsStringSync()) as List<dynamic>;
    for (final fixture in fixtures) {
      final input = fixture['input'];
      final expected = fixture['expected'] as List<dynamic>;
      final point = input['pointer'] as List<dynamic>;
      for (var i = 0; i < generatedScene.layers.length; i++) {
        final actual = sampleLayer(generatedScene.layers[i], (input['progress'] as num).toDouble(),
          pointer: Offset((point[0] as num).toDouble(), (point[1] as num).toDouble()),
          scrollProgress: (input['scroll'] as num).toDouble(), reducedMotion: input['reduced'] as bool);
        expect(actual.offset.dx, closeTo(expected[i]['offset'][0] as num, 1e-9));
        expect(actual.offset.dy, closeTo(expected[i]['offset'][1] as num, 1e-9));
        expect(actual.scale, closeTo(expected[i]['scale'] as num, 1e-9));
        expect(actual.opacity, closeTo(expected[i]['opacity'] as num, 1e-9));
      }
    }
  });
  test('Every layer settles and reduced motion ignores pointer and scroll', () {
    for (final layer in generatedScene.layers) {
      final settled = sampleLayer(layer, 1);
      expect(settled.offset, Offset.zero);
      expect(settled.scale, 1);
      expect(settled.opacity, 1);
      final reduced = sampleLayer(layer, 0, pointer: const Offset(1, -1), scrollProgress: 1, reducedMotion: true);
      expect(reduced.offset, Offset.zero);
      expect(reduced.scale, 1);
      expect(reduced.opacity, 1);
    }
  });

  test('Rewinding has no accumulated state', () {
    for (final layer in generatedScene.layers) {
      final before = sampleLayer(layer, 0.25);
      sampleLayer(layer, 0.9);
      final after = sampleLayer(layer, 0.25);
      expect(after.offset, before.offset);
      expect(after.scale, before.scale);
      expect(after.opacity, before.opacity);
    }
  });

  testWidgets('Stage remains finite across portrait and landscape viewports', (tester) async {
    for (final size in [const Size(390, 844), const Size(844, 390), const Size(1440, 900)]) {
      tester.view.physicalSize = size;
      tester.view.devicePixelRatio = 1;
      await tester.pumpWidget(MaterialApp(home: SceneStage(scene: generatedScene, progress: 0.5)));
      await tester.pump();
      expect(tester.takeException(), isNull);
    }
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
  });

  testWidgets('Player mounts, respects reduced motion, and disposes', (tester) async {
    await tester.pumpWidget(MaterialApp(home: ScenePlayer(scene: generatedScene)));
    await tester.pumpAndSettle();
    await tester.pumpWidget(MaterialApp(home: ScenePlayer(scene: generatedScene, reducedMotion: true)));
    await tester.pump();
    expect(tester.takeException(), isNull);
    await tester.pumpWidget(const SizedBox.shrink());
    expect(tester.takeException(), isNull);
  });

  testWidgets('Only the latest ready target commits; loading preserves the previous scene', (tester) async {
    final ready = <String, Completer<void>>{};
    Future<void> prepare(SceneSpec scene, BuildContext context) =>
      (ready[scene.id] = Completer<void>()).future;
    Widget show(SceneSpec scene) => MaterialApp(home: ScenePlayer(scene: scene, prepareScene: prepare));
    final a = named('a'), b = named('b'), c = named('c');
    await tester.pumpWidget(show(a));
    ready['a']!.complete(); await tester.pump();
    expect(tester.widget<SceneStage>(find.byType(SceneStage)).scene.id, 'a');
    await tester.pumpWidget(show(b));
    await tester.pumpWidget(show(c));
    ready['b']!.complete(); await tester.pump();
    expect(tester.widget<SceneStage>(find.byType(SceneStage)).scene.id, 'a');
    ready['c']!.complete(); await tester.pump();
    expect(tester.widget<SceneStage>(find.byType(SceneStage)).scene.id, 'c');
    await tester.pumpWidget(const SizedBox.shrink());
    expect(tester.takeException(), isNull);
  });

  testWidgets('Failure retains the current scene and retry commits only after readiness', (tester) async {
    final ready = <String, Completer<void>>{};
    Future<void> prepare(SceneSpec scene, BuildContext context) =>
      (ready[scene.id] = Completer<void>()).future;
    Widget show(SceneSpec scene) => MaterialApp(home: ScenePlayer(scene: scene, prepareScene: prepare));
    final a = named('a'), b = named('b');
    await tester.pumpWidget(show(a)); ready['a']!.complete(); await tester.pump();
    await tester.pumpWidget(show(b)); ready['b']!.completeError(StateError('Fixture failure'));
    await tester.pump();
    expect(tester.widget<SceneStage>(find.byType(SceneStage)).scene.id, 'a');
    expect(find.text('Scene could not load. Retry'), findsOneWidget);
    await tester.tap(find.text('Scene could not load. Retry')); await tester.pump();
    ready['b']!.complete(); await tester.pump();
    expect(tester.widget<SceneStage>(find.byType(SceneStage)).scene.id, 'b');
    expect(find.text('Scene could not load. Retry'), findsNothing);
    await tester.pumpWidget(const SizedBox.shrink());
    expect(tester.takeException(), isNull);
  });

  testWidgets('Unmounting during readiness ignores later completion', (tester) async {
    final ready = Completer<void>();
    await tester.pumpWidget(MaterialApp(home: ScenePlayer(scene: generatedScene,
      prepareScene: (scene, context) => ready.future)));
    await tester.pumpWidget(const SizedBox.shrink());
    ready.complete(); await tester.pump();
    expect(tester.takeException(), isNull);
  });

  testWidgets('OS reduced motion changes settle the currently mounted scene', (tester) async {
    Widget show(bool reduce) => MaterialApp(home: MediaQuery(
      data: MediaQueryData(disableAnimations: reduce),
      child: ScenePlayer(scene: generatedScene, prepareScene: (scene, context) async {}),
    ));
    await tester.pumpWidget(show(false)); await tester.pump();
    await tester.pumpWidget(show(true)); await tester.pump();
    final stage = tester.widget<SceneStage>(find.byType(SceneStage));
    expect(stage.reducedMotion, true); expect(stage.progress, 1);
    await tester.pumpWidget(const SizedBox.shrink());
    expect(tester.takeException(), isNull);
  });

  testWidgets('Platform reduceMotion settles even when disableAnimations is false', (tester) async {
    addTearDown(tester.binding.platformDispatcher.clearAccessibilityFeaturesTestValue);
    await tester.pumpWidget(MaterialApp(home: ScenePlayer(scene: generatedScene,
      prepareScene: (scene, context) async {})));
    await tester.pump();
    tester.binding.platformDispatcher.accessibilityFeaturesTestValue = const FakeAccessibilityFeatures(reduceMotion: true);
    await tester.pump();
    final stage = tester.widget<SceneStage>(find.byType(SceneStage));
    expect(stage.reducedMotion, true); expect(stage.progress, 1);
    await tester.pumpWidget(const SizedBox.shrink());
    expect(tester.takeException(), isNull);
  });

  testWidgets('QA harness real controls switch scenes and scrub the timeline', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: qa.SceneQaHarness()));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Scene B'));
    await tester.pumpAndSettle();
    expect(tester.widget<SceneStage>(find.byType(SceneStage)).scene.id, endsWith('_B'));
    await tester.tap(find.text('Manual timeline'));
    await tester.pump();
    await tester.drag(find.byType(Slider), const Offset(-160, 0));
    await tester.pump();
    expect(tester.widget<SceneStage>(find.byType(SceneStage)).progress, lessThan(1));
    await tester.tap(find.text('Reduced motion override'));
    await tester.pump();
    expect(tester.widget<SceneStage>(find.byType(SceneStage)).reducedMotion, true);
    await tester.pumpWidget(const SizedBox.shrink());
    expect(tester.takeException(), isNull);
  });

  testWidgets('QA failure control preserves the scene and real retry recovers', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: qa.SceneQaHarness()));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Fail next load'));
    await tester.tap(find.text('Fail next load'));
    await tester.ensureVisible(find.text('Scene B'));
    await tester.tap(find.text('Scene B'));
    await tester.pumpAndSettle();
    expect(tester.widget<SceneStage>(find.byType(SceneStage)).scene.id, endsWith('_A'));
    await tester.tap(find.byTooltip('Hide QA inspector'));
    await tester.pump();
    await tester.tap(find.text('Scene could not load. Retry'));
    await tester.pumpAndSettle();
    expect(tester.widget<SceneStage>(find.byType(SceneStage)).scene.id, endsWith('_B'));
    await tester.pumpWidget(const SizedBox.shrink());
    expect(tester.takeException(), isNull);
  });
}
