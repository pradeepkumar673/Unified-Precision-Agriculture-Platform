import { useState, createContext, useContext, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, Outlet } from 'react-router-dom';

// Layouts & Root Pages
import AppShell from './layouts/AppShell';
import MainLayout from './layouts/MainLayout';
import FullscreenLayout from './components/FullscreenLayout';
import DashboardPage from './pages/DashboardPage';
import PrivacyPolicyPage from './pages/legal/PrivacyPolicyPage';
import TermsPage from './pages/legal/TermsPage';

// Farm Screens (Stitch pixel-exact)
import SplashWelcomeScreen from './pages/farm/SplashWelcomeScreen';
import PhoneNumberLogin from './pages/farm/PhoneNumberLogin';
import RoleSelection from './pages/farm/RoleSelection';
import FarmSetupWizardStep1Of3 from './pages/farm/FarmSetupWizardStep1Of3';
import FieldMapping from './pages/farm/FieldMapping';
import MainHomeDashboard from './pages/farm/MainHomeDashboard';

// Planning Screens (Stitch pixel-exact)
import CropPlanRecommendation from './pages/planning/CropPlanRecommendation';
import SeasonPerformanceReport from './pages/planning/SeasonPerformanceReport';
import SeasonTimeline from './pages/planning/SeasonTimeline';
import CropRotationSuggestion from './pages/planning/CropRotationSuggestion';
import VarietyComparison from './pages/planning/VarietyComparison';

// Health Screens (Stitch pixel-exact)
import LeafDiseaseScanner from './pages/health/LeafDiseaseScanner';
import CropDiagnosisResult from './pages/health/CropDiagnosisResult';
import { jwtDecode } from 'jwt-decode';

// Feature Groups
import FarmerProfileSettings from './pages/farm/FarmerProfileSettings';
import TheMoreMenuFeatureHub from './pages/farm/TheMoreMenuFeatureHub';
import FarmProfilePage from './pages/farm/FarmProfilePage';
import FieldBoundaryPage from './pages/farm/FieldBoundaryPage';
import CropPlanningPage from './pages/planning/CropPlanningPage';
import RotationPage from './pages/planning/RotationPage';
import VariableRatePage from './pages/planning/VariableRatePage';
import DiseaseDiagnosisPage from './pages/health/DiseaseDiagnosisPage';
import PestRiskPage from './pages/health/PestRiskPage';
import LivestockPage from './pages/health/LivestockPage';
import IrrigationRecommendation from './pages/water_soil/IrrigationRecommendation';
import WaterDemandForecast from './pages/water_soil/WaterDemandForecast';
import ZoneManagementVariableRate from './pages/water_soil/ZoneManagementVariableRate';
import SoilHealthHeatmap from './pages/water_soil/SoilHealthHeatmap';
import MandiPriceForecast from './pages/vision_forecast/MandiPriceForecast';
import YieldForecast from './pages/vision_forecast/YieldForecast';
import SatelliteCropStress from './pages/vision_forecast/SatelliteCropStress';
import DronePlantCountingClimateRisk from './pages/vision_forecast/DronePlantCountingClimateRisk';
import InputsMarketplacePage from './pages/marketplace/InputsMarketplacePage';
import MachineryLaborPage from './pages/marketplace/MachineryLaborPage';
import BuyerExchangePage from './pages/marketplace/BuyerExchangePage';
import InputsBrowse from './pages/marketplace/InputsBrowse.jsx';
import ProductDetailMachineryRental from './pages/marketplace/ProductDetailMachineryRental.jsx';
import HarvestSellProduce from './pages/marketplace/HarvestSellProduce.jsx';
import DeliveryLogisticsTracking from './pages/marketplace/DeliveryLogisticsTracking.jsx';
import WalletTransactionLedger from './pages/finance/WalletTransactionLedger.jsx';
import PaymentCheckout from './pages/finance/PaymentCheckout.jsx';
import CreditMarketplaceInsurance from './pages/finance/CreditMarketplaceInsurance.jsx';
import SchemeMatching from './pages/gov_compliance/SchemeMatching.jsx';
import FarmerDocumentVault from './pages/gov_compliance/FarmerDocumentVault.jsx';
import ProduceTraceabilityEnergy from './pages/gov_compliance/ProduceTraceabilityEnergy.jsx';
import SeasonReportPage from './pages/community/SeasonReportPage';
import GrowerScorePage from './pages/community/GrowerScorePage';
import FPOCommunityPage from './pages/community/FPOCommunityPage';
import DigitalSakhi from './pages/community/DigitalSakhi';
import FarmAlerts from './pages/community/FarmAlerts';
import ShgSharedBookings from './pages/community/ShgSharedBookings';
import CommunityDiseaseOutbreakMap from './pages/community/CommunityDiseaseOutbreakMap';
import FpoCooperativeSuite from './pages/community/FpoCooperativeSuite';

// Voice/AI
import VoiceAssistantPage from './pages/advanced_ai/VoiceAssistantPage';
import CounterfactualWhatIfSimulator from './pages/advanced_ai/CounterfactualWhatIfSimulator';
import MultimodalQuery from './pages/advanced_ai/MultimodalQuery';
import FederatedLearningPage from './pages/advanced_ai/FederatedLearningPage';
import LiveSensorDashboard from './pages/cea_iot/LiveSensorDashboard';
import HydroponicsClimateControl from './pages/cea_iot/HydroponicsClimateControl';
import VerticalFarmShelfMonitor from './pages/cea_iot/VerticalFarmShelfMonitor';
import TraceabilityPage from './pages/cea_iot/TraceabilityPage';

// Auth Context
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

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
      return <Navigate to="/login" replace />;
    }
    try {
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        return <Navigate to="/login" replace />;
      }
    } catch (err) {
      localStorage.removeItem('token');
      return <Navigate to="/login" replace />;
    }
    return children ? children : <Outlet />;
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      <RouterHelper />
      <Routes>
          {/* Onboarding flow — no auth needed */}
          <Route path="/splash" element={<SplashWelcomeScreen />} />
          <Route path="/onboarding/phone" element={<PhoneNumberLogin />} />
          <Route path="/onboarding/role" element={<RoleSelection />} />
          <Route path="/onboarding/farm-setup" element={<FarmSetupWizardStep1Of3 />} />
          <Route path="/onboarding/field-mapping" element={<FieldMapping />} />
          <Route path="/login" element={<PhoneNumberLogin />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          
          {/* Genuine No-Chrome / Fullscreen Routes */}
          <Route element={<ProtectedRoute><FullscreenLayout /></ProtectedRoute>}>
            <Route path="/farm/boundary" element={<FieldMapping />} />
            <Route path="/health/disease-scanner" element={<LeafDiseaseScanner />} />
            <Route path="/ai/assistant" element={<VoiceAssistantPage />} />
            <Route path="/ai/multimodal-query" element={<MultimodalQuery />} />
          </Route>

          {/* Self-wrapped screens that inject a headerSlot */}
          <Route element={<ProtectedRoute />}>
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
    </AuthContext.Provider>
  );
}

export default App;
