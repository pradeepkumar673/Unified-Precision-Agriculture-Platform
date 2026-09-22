import { useState, createContext, useContext, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, Outlet } from 'react-router-dom';

// Layouts & Root Pages
import AppShell from './layouts/AppShell';
import MainLayout from './layouts/MainLayout';
import FullscreenLayout from './components/FullscreenLayout';
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/legal/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('./pages/legal/TermsPage'));

// Farm Screens (Stitch pixel-exact)
import SplashWelcomeScreen from './pages/farm/SplashWelcomeScreen';
import PhoneNumberLogin from './pages/farm/PhoneNumberLogin';
const RoleSelection = lazy(() => import('./pages/farm/RoleSelection'));
const FarmSetupWizardStep1Of3 = lazy(() => import('./pages/farm/FarmSetupWizardStep1Of3'));
const FieldMapping = lazy(() => import('./pages/farm/FieldMapping'));
const MainHomeDashboard = lazy(() => import('./pages/farm/MainHomeDashboard'));

// Planning Screens (Stitch pixel-exact)
const CropPlanRecommendation = lazy(() => import('./pages/planning/CropPlanRecommendation'));
const SeasonPerformanceReport = lazy(() => import('./pages/planning/SeasonPerformanceReport'));
const SeasonTimeline = lazy(() => import('./pages/planning/SeasonTimeline'));
const CropRotationSuggestion = lazy(() => import('./pages/planning/CropRotationSuggestion'));
const VarietyComparison = lazy(() => import('./pages/planning/VarietyComparison'));

// Health Screens (Stitch pixel-exact)
const LeafDiseaseScanner = lazy(() => import('./pages/health/LeafDiseaseScanner'));
const CropDiagnosisResult = lazy(() => import('./pages/health/CropDiagnosisResult'));
import { jwtDecode } from 'jwt-decode';

// Feature Groups
const FarmerProfileSettings = lazy(() => import('./pages/farm/FarmerProfileSettings'));
const TheMoreMenuFeatureHub = lazy(() => import('./pages/farm/TheMoreMenuFeatureHub'));
const FarmProfilePage = lazy(() => import('./pages/farm/FarmProfilePage'));
const FieldBoundaryPage = lazy(() => import('./pages/farm/FieldBoundaryPage'));
const CropPlanningPage = lazy(() => import('./pages/planning/CropPlanningPage'));
const RotationPage = lazy(() => import('./pages/planning/RotationPage'));
const VariableRatePage = lazy(() => import('./pages/planning/VariableRatePage'));
const DiseaseDiagnosisPage = lazy(() => import('./pages/health/DiseaseDiagnosisPage'));
const PestRiskPage = lazy(() => import('./pages/health/PestRiskPage'));
const LivestockPage = lazy(() => import('./pages/health/LivestockPage'));
const IrrigationRecommendation = lazy(() => import('./pages/water_soil/IrrigationRecommendation'));
const WaterDemandForecast = lazy(() => import('./pages/water_soil/WaterDemandForecast'));
const ZoneManagementVariableRate = lazy(() => import('./pages/water_soil/ZoneManagementVariableRate'));
const SoilHealthHeatmap = lazy(() => import('./pages/water_soil/SoilHealthHeatmap'));
const MandiPriceForecast = lazy(() => import('./pages/vision_forecast/MandiPriceForecast'));
const YieldForecast = lazy(() => import('./pages/vision_forecast/YieldForecast'));
const SatelliteCropStress = lazy(() => import('./pages/vision_forecast/SatelliteCropStress'));
const DronePlantCountingClimateRisk = lazy(() => import('./pages/vision_forecast/DronePlantCountingClimateRisk'));
const InputsMarketplacePage = lazy(() => import('./pages/marketplace/InputsMarketplacePage'));
const MachineryLaborPage = lazy(() => import('./pages/marketplace/MachineryLaborPage'));
const BuyerExchangePage = lazy(() => import('./pages/marketplace/BuyerExchangePage'));
const InputsBrowse = lazy(() => import('./pages/marketplace/InputsBrowse.jsx'));
const ProductDetailMachineryRental = lazy(() => import('./pages/marketplace/ProductDetailMachineryRental.jsx'));
const HarvestSellProduce = lazy(() => import('./pages/marketplace/HarvestSellProduce.jsx'));
const DeliveryLogisticsTracking = lazy(() => import('./pages/marketplace/DeliveryLogisticsTracking.jsx'));
const WalletTransactionLedger = lazy(() => import('./pages/finance/WalletTransactionLedger.jsx'));
const PaymentCheckout = lazy(() => import('./pages/finance/PaymentCheckout.jsx'));
const CreditMarketplaceInsurance = lazy(() => import('./pages/finance/CreditMarketplaceInsurance.jsx'));
const SchemeMatching = lazy(() => import('./pages/gov_compliance/SchemeMatching.jsx'));
const FarmerDocumentVault = lazy(() => import('./pages/gov_compliance/FarmerDocumentVault.jsx'));
const ProduceTraceabilityEnergy = lazy(() => import('./pages/gov_compliance/ProduceTraceabilityEnergy.jsx'));
const SeasonReportPage = lazy(() => import('./pages/community/SeasonReportPage'));
const GrowerScorePage = lazy(() => import('./pages/community/GrowerScorePage'));
const FPOCommunityPage = lazy(() => import('./pages/community/FPOCommunityPage'));
const DigitalSakhi = lazy(() => import('./pages/community/DigitalSakhi'));
const FarmAlerts = lazy(() => import('./pages/community/FarmAlerts'));
const ShgSharedBookings = lazy(() => import('./pages/community/ShgSharedBookings'));
const CommunityDiseaseOutbreakMap = lazy(() => import('./pages/community/CommunityDiseaseOutbreakMap'));
const FpoCooperativeSuite = lazy(() => import('./pages/community/FpoCooperativeSuite'));

// Voice/AI
const VoiceAssistantPage = lazy(() => import('./pages/advanced_ai/VoiceAssistantPage'));
const CounterfactualWhatIfSimulator = lazy(() => import('./pages/advanced_ai/CounterfactualWhatIfSimulator'));
const MultimodalQuery = lazy(() => import('./pages/advanced_ai/MultimodalQuery'));
const FederatedLearningPage = lazy(() => import('./pages/advanced_ai/FederatedLearningPage'));
const LiveSensorDashboard = lazy(() => import('./pages/cea_iot/LiveSensorDashboard'));
const HydroponicsClimateControl = lazy(() => import('./pages/cea_iot/HydroponicsClimateControl'));
const VerticalFarmShelfMonitor = lazy(() => import('./pages/cea_iot/VerticalFarmShelfMonitor'));
const TraceabilityPage = lazy(() => import('./pages/cea_iot/TraceabilityPage'));

// Auth Context
const AuthContext = createContext(null);
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      token: localStorage.getItem('token'),
      login: (t) => { localStorage.setItem('token', t); window.location.reload(); },
      logout: () => { localStorage.removeItem('token'); window.location.href = '/#/splash'; window.location.reload(); }
    };
  }
  return ctx;
};

function RouterHelper() {
  const navigate = useNavigate();
  useEffect(() => {
    window.routerNavigate = navigate;
  }, [navigate]);
  return null;
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  // Protected Route Wrapper
  const ProtectedRoute = ({ children }) => {
    if (!token) {
      return <Navigate to="/splash" replace />;
    }
    try {
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        return <Navigate to="/splash" replace />;
      }
    } catch (err) {
      localStorage.removeItem('token');
      return <Navigate to="/splash" replace />;
    }
    return children ? children : <Outlet />;
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      <RouterHelper />
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background"><span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span></div>}>
          <Routes>
          {/* Onboarding flow — no auth needed */}
          <Route path="/splash" element={<SplashWelcomeScreen />} />
          <Route path="/onboarding/phone" element={<PhoneNumberLogin />} />
          <Route path="/onboarding/role" element={<RoleSelection />} />
          <Route path="/onboarding/farm-setup" element={<FarmSetupWizardStep1Of3 />} />
          <Route path="/login" element={<PhoneNumberLogin />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          
          {/* Genuine No-Chrome / Fullscreen Routes */}
          {/* Fullscreen screens (if any remaining) */}
          <Route element={<ProtectedRoute><FullscreenLayout /></ProtectedRoute>}>
          </Route>

          {/* Self-wrapped screens that inject a headerSlot or use AppShell internally */}
          <Route element={<ProtectedRoute />}>
            <Route path="/farm/boundary" element={<FieldMapping />} />
            <Route path="/health/disease-scanner" element={<LeafDiseaseScanner />} />
            <Route path="/ai/assistant" element={<VoiceAssistantPage />} />
            <Route path="/ai/multimodal-query" element={<MultimodalQuery />} />
            <Route path="/vision/price-forecast" element={<MandiPriceForecast />} />
            <Route path="/vision/drone-climate" element={<DronePlantCountingClimateRisk />} />
          </Route>
          
          {/* Main Application Routes Wrapped in AppShell */}
          <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route path="/" element={<MainHomeDashboard />} />
            <Route path="/more" element={<TheMoreMenuFeatureHub />} />
            
            {/* Farm & Planning */}
            <Route path="/farm/profile" element={<FarmerProfileSettings />} />
            <Route path="/planning/crop-plan" element={<CropPlanRecommendation />} />
            <Route path="/planning/season-timeline" element={<SeasonTimeline />} />
            <Route path="/planning/season-performance" element={<SeasonPerformanceReport />} />
            <Route path="/planning/rotation" element={<CropRotationSuggestion />} />
            <Route path="/planning/variety-comparison" element={<VarietyComparison />} />
            <Route path="/planning/variable-rate" element={<VariableRatePage />} />
            
            {/* Health */}
            <Route path="/health/disease-result" element={<CropDiagnosisResult />} />
            <Route path="/health/pest-risk" element={<PestRiskPage />} />
            <Route path="/health/livestock" element={<LivestockPage />} />
            
            {/* Water & Soil */}
            <Route path="/water-soil/irrigation" element={<IrrigationRecommendation />} />
            <Route path="/water-soil/demand-forecast" element={<WaterDemandForecast />} />
            <Route path="/water-soil/zone-management" element={<ZoneManagementVariableRate />} />
            <Route path="/water-soil/soil-health" element={<SoilHealthHeatmap />} />
            
            {/* Vision & Forecast */}
            <Route path="/vision/satellite" element={<SatelliteCropStress />} />
            <Route path="/vision/yield-forecast" element={<YieldForecast />} />
            
            {/* Marketplace */}
            <Route path="/marketplace/inputs" element={<InputsBrowse />} />
            <Route path="/marketplace/rentals" element={<MachineryLaborPage />} />
            <Route path="/marketplace/exchange" element={<BuyerExchangePage />} />
            <Route path="/marketplace/machinery" element={<ProductDetailMachineryRental />} />
            <Route path="/marketplace/harvest" element={<HarvestSellProduce />} />
            <Route path="/marketplace/delivery/:orderId?" element={<DeliveryLogisticsTracking />} />
            
            {/* Finance */}
            <Route path="/finance/wallet" element={<WalletTransactionLedger />} />
            <Route path="/finance/checkout" element={<PaymentCheckout />} />
            <Route path="/finance/credit-insurance" element={<CreditMarketplaceInsurance />} />
            
            {/* Gov Compliance */}
            <Route path="/gov/schemes" element={<SchemeMatching />} />
            <Route path="/gov/documents" element={<FarmerDocumentVault />} />
            <Route path="/gov/traceability" element={<ProduceTraceabilityEnergy />} />
            
            {/* Community */}
            <Route path="/community/season-report" element={<SeasonReportPage />} />
            <Route path="/community/grower-score" element={<GrowerScorePage />} />
            <Route path="/community/fpo" element={<FPOCommunityPage />} />
            <Route path="/community/digital-sakhi" element={<DigitalSakhi />} />
            <Route path="/community/alerts" element={<FarmAlerts />} />
            <Route path="/community/shg-bookings" element={<ShgSharedBookings />} />
            <Route path="/community/disease-map" element={<CommunityDiseaseOutbreakMap />} />
            <Route path="/community/fpo-cooperative-suite" element={<FpoCooperativeSuite />} />
            
            {/* AI & IoT */}
            <Route path="/ai/causal-lab" element={<CounterfactualWhatIfSimulator />} />
            <Route path="/ai/federated-learning" element={<FederatedLearningPage />} />
            <Route path="/iot/dashboard" element={<LiveSensorDashboard />} />
            <Route path="/iot/hydro-climate" element={<HydroponicsClimateControl />} />
            <Route path="/iot/shelves" element={<VerticalFarmShelfMonitor />} />
            <Route path="/iot/traceability" element={<TraceabilityPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
          </Suspense>
    </AuthContext.Provider>
  );
}

export default App;
