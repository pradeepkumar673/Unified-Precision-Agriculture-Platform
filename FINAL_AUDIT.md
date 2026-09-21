# UI Structural Audit

## AppShell Conflicts (Double Headers/Navs)
The following screens contain hardcoded `<header>` or `<nav>` elements that visually overlap with the global `AppShell`:

- **FieldMapping**: Double Header
- **VoiceAssistantPage**: Double Header
- **MultimodalQuery**: Double Header

## Screen Drift (Masked Pixelmatch vs code.html)
| Component | Match Status | Diff % |
| :--- | :--- | :--- |
| `PhoneNumberLogin` | ❌ DRIFT | 98.95% |
| `CreditMarketplaceInsurance` | ❌ DRIFT | 98.75% |
| `VerticalFarmShelfMonitor` | ❌ DRIFT | 98.69% |
| `LiveSensorDashboard` | ❌ DRIFT | 98.38% |
| `PaymentCheckout` | ❌ DRIFT | 98.38% |
| `YieldForecast` | ❌ DRIFT | 98.37% |
| `HarvestSellProduce` | ❌ DRIFT | 98.37% |
| `WaterDemandForecast` | ❌ DRIFT | 98.33% |
| `FarmerProfileSettings` | ❌ DRIFT | 98.33% |
| `RoleSelection` | ❌ DRIFT | 98.28% |
| `VarietyComparison` | ❌ DRIFT | 98.27% |
| `SeasonTimeline` | ❌ DRIFT | 98.23% |
| `MainHomeDashboard` | ❌ DRIFT | 98.21% |
| `CropDiagnosisResult` | ❌ DRIFT | 98.2% |
| `IrrigationRecommendation` | ❌ DRIFT | 98.15% |
| `HydroponicsClimateControl` | ❌ DRIFT | 98.15% |
| `SplashWelcomeScreen` | ❌ DRIFT | 97.98% |
| `MandiPriceForecast` | ❌ DRIFT | 97.97% |
| `ZoneManagementVariableRate` | ❌ DRIFT | 97.77% |
| `CounterfactualWhatIfSimulator` | ❌ DRIFT | 97.73% |
| `WalletTransactionLedger` | ❌ DRIFT | 97.58% |
| `FarmSetupWizardStep1Of3` | ❌ DRIFT | 97.54% |
| `VoiceAssistantPage` | ❌ DRIFT | 97.51% |
| `TheMoreMenuFeatureHub` | ❌ DRIFT | 97.5% |
| `FarmerDocumentVault` | ❌ DRIFT | 97.39% |
| `CropRotationSuggestion` | ❌ DRIFT | 97.29% |
| `InputsBrowse` | ❌ DRIFT | 96.99% |
| `ProductDetailMachineryRental` | ❌ DRIFT | 96.88% |
| `SatelliteCropStress` | ❌ DRIFT | 96.59% |
| `SoilHealthHeatmap` | ❌ DRIFT | 96.43% |
| `DeliveryLogisticsTracking` | ❌ DRIFT | 96.34% |
| `CommunityDiseaseOutbreakMap` | ❌ DRIFT | 96.07% |
| `FpoCooperativeSuite` | ❌ DRIFT | 96.06% |
| `ProduceTraceabilityEnergy` | ❌ DRIFT | 95.59% |
| `DronePlantCountingClimateRisk` | ❌ DRIFT | 95.58% |
| `SeasonPerformanceReport` | ❌ DRIFT | 93.75% |
| `ShgSharedBookings` | ❌ DRIFT | 93.6% |
| `LeafDiseaseScanner` | ❌ DRIFT | 93.18% |
| `MultimodalQuery` | ❌ DRIFT | 92.57% |
| `CropPlanRecommendation` | ❌ DRIFT | 26.34% |
| `DigitalSakhi` | ❌ DRIFT | 23.43% |
| `FieldMapping` | ❌ DRIFT | 18.68% |
| `SchemeMatching` | ❌ DRIFT | 15.94% |
| `FarmAlerts` | ❌ DRIFT | 8.28% |
