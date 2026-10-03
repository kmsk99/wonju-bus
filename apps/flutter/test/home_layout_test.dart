import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:wonju_bus_flutter/app.dart';

void main() {
  for (final scale in [1.0, 2.0]) {
    testWidgets('home fits 320px with text scale $scale', (tester) async {
      tester.view.physicalSize = const Size(320, 900);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      await tester.pumpWidget(
        MaterialApp(
          builder: (context, child) => MediaQuery(
            data: MediaQuery.of(
              context,
            ).copyWith(textScaler: TextScaler.linear(scale)),
            child: const WonjuBusApp(),
          ),
        ),
      );
      await tester.pump();
      expect(find.text('다음 버스,\n몇 시에 출발할까요?'), findsOneWidget);
      expect(tester.takeException(), isNull);
      await tester.scrollUntilVisible(find.text('종점으로 찾기'), 180);
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox.shrink());
    });
  }
}
