---
*** Begin Patch
*** Update File: Frontend/router.tsx
@@
-import HrManagement from './Pages/HrManagement';
+import HrManagement from './Pages/HrManagement';
+import AttendanceCards from './components/hr/AttendanceCards';
+import AttendanceHistory from './components/hr/AttendanceHistory';
@@
-const hrRoute = createRoute({ getParentRoute: () => dashboardRoute, path: '/hr', component: HrManagement });
+const hrRoute = createRoute({ getParentRoute: () => dashboardRoute, path: '/hr', component: HrManagement });
+
+// Sub-routes for HR attendance (cards / history)
+const hrCardsRoute = createRoute({ getParentRoute: () => hrRoute, path: '/cards', component: AttendanceCards });
+const hrHistoryRoute = createRoute({ getParentRoute: () => hrRoute, path: '/history', component: AttendanceHistory });
@@
-    dashboardIndexRoute,
+    dashboardIndexRoute,
@@
-    configurationRoute,
-    hrRoute,
-    secretariatRoute,
+    configurationRoute,
+    hrRoute,
+    hrCardsRoute,
+    hrHistoryRoute,
+    secretariatRoute,
*** End Patch
