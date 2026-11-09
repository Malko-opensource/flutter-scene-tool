// User-owned: add semantic content, navigation, responsive typography, or custom
// Flutter widgets here. Keep source artwork and runtime transforms separate.
import 'package:flutter/material.dart';

class SceneOverlay extends StatelessWidget {
  const SceneOverlay({super.key});
  @override
  Widget build(BuildContext context) => const SafeArea(
    child: Align(alignment: Alignment.topLeft, child: Padding(
      padding: EdgeInsets.all(24),
      child: Text('Your story here', style: TextStyle(fontSize: 28, color: Color(0xff243c3b))),
    )),
  );
}
