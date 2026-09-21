# UI Structural Audit

## AppShell Conflicts (Double Headers/Navs)
The following screens contain hardcoded `<header>` or `<nav>` elements that visually overlap with the global `AppShell`:

- **FieldMapping**: Double Header
- **MultimodalQuery**: Double Header

## Screen Drift (Masked Pixelmatch vs code.html)
| Component | Match Status | Diff % |
| :--- | :--- | :--- |
| `LeafDiseaseScanner` | ❌ DRIFT | 90.81% |
| `MultimodalQuery` | ❌ DRIFT | 38.55% |
| `FpoCooperativeSuite` | ❌ DRIFT | 38.04% |
| `WalletTransactionLedger` | ❌ DRIFT | 34.17% |
| `MandiPriceForecast` | ❌ DRIFT | 33.49% |
| `SatelliteCropStress` | ❌ DRIFT | 31.65% |
| `CommunityDiseaseOutbreakMap` | ❌ DRIFT | 28.43% |
| `ProductDetailMachineryRental` | ❌ DRIFT | 26.99% |
| `ZoneManagementVariableRate` | ❌ DRIFT | 26.5% |
| `DronePlantCountingClimateRisk` | ❌ DRIFT | 26.22% |
| `SeasonPerformanceReport` | ❌ DRIFT | 26.04% |
| `SoilHealthHeatmap` | ❌ DRIFT | 25.43% |
| `FieldMapping` | ❌ DRIFT | 24.2% |
| `CropDiagnosisResult` | ❌ DRIFT | 23.98% |
| `DigitalSakhi` | ❌ DRIFT | 23.87% |
| `ShgSharedBookings` | ❌ DRIFT | 21.45% |
| `CropRotationSuggestion` | ❌ DRIFT | 18.96% |
| `CropPlanRecommendation` | ❌ DRIFT | 18.28% |
| `HydroponicsClimateControl` | ❌ DRIFT | 17.79% |
| `DeliveryLogisticsTracking` | ❌ DRIFT | 17.78% |
| `SchemeMatching` | ❌ DRIFT | 17.1% |
| `FarmerDocumentVault` | ❌ DRIFT | 15.71% |
| `CounterfactualWhatIfSimulator` | ❌ DRIFT | 14.49% |
| `FarmerProfileSettings` | ❌ DRIFT | 14.28% |
| `ProduceTraceabilityEnergy` | ❌ DRIFT | 13.12% |
| `TheMoreMenuFeatureHub` | ❌ DRIFT | 13.12% |
| `IrrigationRecommendation` | ❌ DRIFT | 12.94% |
| `PaymentCheckout` | ❌ DRIFT | 11.68% |
| `FarmSetupWizardStep1Of3` | ❌ DRIFT | 11.12% |
| `FarmAlerts` | ❌ DRIFT | 10.08% |
| `SplashWelcomeScreen` | ❌ DRIFT | 9.64% |
| `PhoneNumberLogin` | ❌ DRIFT | 9.46% |
| `WaterDemandForecast` | ❌ DRIFT | 9.42% |
| `VarietyComparison` | ❌ DRIFT | 8.72% |
| `VerticalFarmShelfMonitor` | ❌ DRIFT | 7.85% |
| `MainHomeDashboard` | ❌ DRIFT | 6.61% |
| `YieldForecast` | ✅ MATCH | 4.57% |
| `LiveSensorDashboard` | ✅ MATCH | 4.22% |
| `HarvestSellProduce` | ✅ MATCH | 3.86% |
| `SeasonTimeline` | ✅ MATCH | 3.85% |
| `CreditMarketplaceInsurance` | ✅ MATCH | 3.69% |
| `RoleSelection` | ✅ MATCH | 3.65% |
