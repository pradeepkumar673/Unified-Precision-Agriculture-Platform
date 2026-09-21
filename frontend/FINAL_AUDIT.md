# UI Structural Audit

## AppShell Conflicts (Double Headers/Navs)
The following screens contain hardcoded `<header>` or `<nav>` elements that visually overlap with the global `AppShell`:

- **FieldMapping**: Double Header
- **LeafDiseaseScanner**: Double Header
- **MandiPriceForecast**: Double Header
- **VoiceAssistantPage**: Double Header
- **MultimodalQuery**: Double Header

## Screen Drift (Masked Pixelmatch vs code.html)
### ShgSharedBookings
- Status: **MISMATCH** (25.19% difference)
- Differences: Check `.visual_diffs_audit/ShgSharedBookings_diff.png` for spacing/layout mismatches.

### ProductDetailMachineryRental
- Status: **MISMATCH** (23.69% difference)
- Differences: Check `.visual_diffs_audit/ProductDetailMachineryRental_diff.png` for spacing/layout mismatches.

### DronePlantCountingClimateRisk
- Status: **MISMATCH** (22.57% difference)
- Differences: Check `.visual_diffs_audit/DronePlantCountingClimateRisk_diff.png` for spacing/layout mismatches.

### SeasonPerformanceReport
- Status: **MISMATCH** (20.68% difference)
- Differences: Check `.visual_diffs_audit/SeasonPerformanceReport_diff.png` for spacing/layout mismatches.

### ZoneManagementVariableRate
- Status: **MISMATCH** (20.4% difference)
- Differences: Check `.visual_diffs_audit/ZoneManagementVariableRate_diff.png` for spacing/layout mismatches.

### WalletTransactionLedger
- Status: **MISMATCH** (19.81% difference)
- Differences: Check `.visual_diffs_audit/WalletTransactionLedger_diff.png` for spacing/layout mismatches.

### IrrigationRecommendation
- Status: **MISMATCH** (18.8% difference)
- Differences: Check `.visual_diffs_audit/IrrigationRecommendation_diff.png` for spacing/layout mismatches.

### FieldMapping
- Status: **MISMATCH** (18.65% difference)
- Differences: Check `.visual_diffs_audit/FieldMapping_diff.png` for spacing/layout mismatches.

### FarmerProfileSettings
- Status: **MISMATCH** (17.16% difference)
- Differences: Check `.visual_diffs_audit/FarmerProfileSettings_diff.png` for spacing/layout mismatches.

### VoiceAssistantPage
- Status: **MISMATCH** (16.11% difference)
- Differences: Check `.visual_diffs_audit/VoiceAssistantPage_diff.png` for spacing/layout mismatches.

### VarietyComparison
- Status: **MISMATCH** (15.77% difference)
- Differences: Check `.visual_diffs_audit/VarietyComparison_diff.png` for spacing/layout mismatches.

### TheMoreMenuFeatureHub
- Status: **MISMATCH** (15.23% difference)
- Differences: Check `.visual_diffs_audit/TheMoreMenuFeatureHub_diff.png` for spacing/layout mismatches.

### SoilHealthHeatmap
- Status: **MISMATCH** (14.25% difference)
- Differences: Check `.visual_diffs_audit/SoilHealthHeatmap_diff.png` for spacing/layout mismatches.

### PaymentCheckout
- Status: **MISMATCH** (14.22% difference)
- Differences: Check `.visual_diffs_audit/PaymentCheckout_diff.png` for spacing/layout mismatches.

### CommunityDiseaseOutbreakMap
- Status: **MISMATCH** (13.53% difference)
- Differences: Check `.visual_diffs_audit/CommunityDiseaseOutbreakMap_diff.png` for spacing/layout mismatches.

### CropDiagnosisResult
- Status: **MISMATCH** (12.7% difference)
- Differences: Check `.visual_diffs_audit/CropDiagnosisResult_diff.png` for spacing/layout mismatches.

### FarmerDocumentVault
- Status: **MISMATCH** (12.39% difference)
- Differences: Check `.visual_diffs_audit/FarmerDocumentVault_diff.png` for spacing/layout mismatches.

### SatelliteCropStress
- Status: **MISMATCH** (11.44% difference)
- Differences: Check `.visual_diffs_audit/SatelliteCropStress_diff.png` for spacing/layout mismatches.

### VerticalFarmShelfMonitor
- Status: **MISMATCH** (10.23% difference)
- Differences: Check `.visual_diffs_audit/VerticalFarmShelfMonitor_diff.png` for spacing/layout mismatches.

### FarmSetupWizardStep1Of3
- Status: **MISMATCH** (9.23% difference)
- Differences: Check `.visual_diffs_audit/FarmSetupWizardStep1Of3_diff.png` for spacing/layout mismatches.

### DigitalSakhi
- Status: **MISMATCH** (7.37% difference)
- Differences: Check `.visual_diffs_audit/DigitalSakhi_diff.png` for spacing/layout mismatches.

### FarmAlerts
- Status: **MISMATCH** (6.84% difference)
- Differences: Check `.visual_diffs_audit/FarmAlerts_diff.png` for spacing/layout mismatches.

### InputsBrowse
- Status: **MISMATCH** (6.15% difference)
- Differences: Check `.visual_diffs_audit/InputsBrowse_diff.png` for spacing/layout mismatches.

### HydroponicsClimateControl
- Status: **MISMATCH** (6.07% difference)
- Differences: Check `.visual_diffs_audit/HydroponicsClimateControl_diff.png` for spacing/layout mismatches.

### MainHomeDashboard
- Status: **MISMATCH** (5.81% difference)
- Differences: Check `.visual_diffs_audit/MainHomeDashboard_diff.png` for spacing/layout mismatches.

### CropRotationSuggestion
- Status: **MISMATCH** (5.67% difference)
- Differences: Check `.visual_diffs_audit/CropRotationSuggestion_diff.png` for spacing/layout mismatches.

### SeasonTimeline
- Status: **MISMATCH** (5.45% difference)
- Differences: Check `.visual_diffs_audit/SeasonTimeline_diff.png` for spacing/layout mismatches.

### CounterfactualWhatIfSimulator
- Status: **MISMATCH** (5.04% difference)
- Differences: Check `.visual_diffs_audit/CounterfactualWhatIfSimulator_diff.png` for spacing/layout mismatches.

### PhoneNumberLogin
- Status: **MATCH** (4.14% difference)

### SchemeMatching
- Status: **MATCH** (3.88% difference)

### ProduceTraceabilityEnergy
- Status: **MATCH** (3.33% difference)

### WaterDemandForecast
- Status: **MATCH** (3.31% difference)

### CreditMarketplaceInsurance
- Status: **MATCH** (3.09% difference)

### RoleSelection
- Status: **MATCH** (2.68% difference)

### MultimodalQuery
- Status: **MATCH** (2.35% difference)

### LiveSensorDashboard
- Status: **MATCH** (2.1% difference)

### HarvestSellProduce
- Status: **MATCH** (1.1% difference)

### DeliveryLogisticsTracking
- Status: **MATCH** (0.99% difference)

### SplashWelcomeScreen
- Status: **MATCH** (0.6% difference)

### YieldForecast
- Status: **MATCH** (0.37% difference)

### FpoCooperativeSuite
- Status: **MATCH** (0.25% difference)

### CropPlanRecommendation
- Status: **MATCH** (0.13% difference)

### LeafDiseaseScanner
- Status: **MATCH** (0% difference)

### MandiPriceForecast
- Status: **MATCH** (0% difference)

