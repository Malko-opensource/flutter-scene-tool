// User-owned application shell. scene-tool emit never rewrites this file.
import 'package:flutter/material.dart';
import 'generated/scene_data.dart';
import 'generated/scene_runtime.dart';
import 'custom_scene.dart';

void main() => runApp(const SceneApp());

class SceneApp extends StatelessWidget {
  const SceneApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
    debugShowCheckedModeBanner: false,
    title: 'Editable Flutter scene',
    home: Scaffold(body: Stack(fit: StackFit.expand, children: [
      ScenePlayer(scene: generatedScene),
      const SceneOverlay(),
    ])),
  );
}
