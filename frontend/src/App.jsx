import { useState, createContext, useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts & Root Pages
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/auth/LoginPage';
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

// Feature Groups
import FarmProfilePage from './pages/farm/FarmProfilePage';
import FieldBoundaryPage from './pages/farm/FieldBoundaryPage';
import CropPlanningPage from './pages/planning/CropPlanningPage';
import RotationPage from './pages/planning/RotationPage';
import VariableRatePage from './pages/planning/VariableRatePage';
import DiseaseDiagnosisPage from './pages/health/DiseaseDiagnosisPage';
import PestRiskPage from './pages/health/PestRiskPage';
import LivestockPage from './pages/health/LivestockPage';
import IrrigationPage from './pages/water_soil/IrrigationPage';
import SoilHealthPage from './pages/water_soil/SoilHealthPage';
import SatelliteVisionPage from './pages/vision_forecast/SatelliteVisionPage';
import PriceForecastPage from './pages/vision_forecast/PriceForecastPage';
import YieldClimatePage from './pages/vision_forecast/YieldClimatePage';
import InputsMarketplacePage from './pages/marketplace/InputsMarketplacePage';
import MachineryLaborPage from './pages/marketplace/MachineryLaborPage';
import BuyerExchangePage from './pages/marketplace/BuyerExchangePage';
import CreditLoanPage from './pages/finance/CreditLoanPage';
import LedgerPage from './pages/finance/LedgerPage';
import InsuranceWarehousePage from './pages/finance/InsuranceWarehousePage';
import SchemeDiscoveryPage from './pages/gov_compliance/SchemeDiscoveryPage';
import DocumentVaultPage from './pages/gov_compliance/DocumentVaultPage';
import SeasonReportPage from './pages/community/SeasonReportPage';
import GrowerScorePage from './pages/community/GrowerScorePage';
import FPOCommunityPage from './pages/community/FPOCommunityPage';
import VoiceAssistantPage from './pages/advanced_ai/VoiceAssistantPage';
import CausalSimulatorPage from './pages/advanced_ai/CausalSimulatorPage';
import FederatedLearningPage from './pages/advanced_ai/FederatedLearningPage';
import FacilityDashboardPage from './pages/cea_iot/FacilityDashboardPage';
import TraceabilityPage from './pages/cea_iot/TraceabilityPage';

// Auth Context
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

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
    return children;
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      <Routes>
        {/* Onboarding flow — no auth needed */}
        <Route path="/" element={<SplashWelcomeScreen />} />
        <Route path="/onboarding/phone" element={<PhoneNumberLogin />} />
        <Route path="/onboarding/role" element={<RoleSelection />} />
        <Route path="/onboarding/farm-setup" element={<FarmSetupWizardStep1Of3 />} />
        <Route path="/onboarding/field-mapping" element={<FieldMapping />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        
        {/* Main Application Shell */}
        <Route path="/app" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<MainHomeDashboard />} />
          <Route path="home" element={<MainHomeDashboard />} />

          <Route path="farm/profile" element={<FarmProfilePage />} />
          <Route path="farm/boundary" element={<FieldMapping />} />

          <Route path="planning/crop-plan" element={<CropPlanningPage />} />
          <Route path="planning/rotation" element={<RotationPage />} />
          <Route path="planning/variable-rate" element={<VariableRatePage />} />
          
          <Route path="health/disease" element={<DiseaseDiagnosisPage />} />
          <Route path="health/pest-risk" element={<PestRiskPage />} />
          <Route path="health/livestock" element={<LivestockPage />} />
          
          <Route path="water-soil/irrigation" element={<IrrigationPage />} />
          <Route path="water-soil/soil-map" element={<SoilHealthPage />} />
          
          <Route path="vision/satellite" element={<SatelliteVisionPage />} />
          <Route path="vision/price-forecast" element={<PriceForecastPage />} />
          <Route path="vision/yield-climate" element={<YieldClimatePage />} />
          
          <Route path="marketplace/inputs" element={<InputsMarketplacePage />} />
          <Route path="marketplace/rentals" element={<MachineryLaborPage />} />
          <Route path="marketplace/exchange" element={<BuyerExchangePage />} />
          
          <Route path="finance/credit-loan" element={<CreditLoanPage />} />
          <Route path="finance/ledger" element={<LedgerPage />} />
          <Route path="finance/insurance-warehouse" element={<InsuranceWarehousePage />} />
          
          <Route path="gov/schemes" element={<SchemeDiscoveryPage />} />
          <Route path="gov/documents" element={<DocumentVaultPage />} />
          
          <Route path="community/season-report" element={<SeasonReportPage />} />
          <Route path="community/grower-score" element={<GrowerScorePage />} />
          <Route path="community/fpo" element={<FPOCommunityPage />} />
          
          <Route path="ai/assistant" element={<VoiceAssistantPage />} />
          <Route path="ai/causal-lab" element={<CausalSimulatorPage />} />
          <Route path="ai/federated-learning" element={<FederatedLearningPage />} />
          
          <Route path="iot/dashboard" element={<FacilityDashboardPage />} />
          <Route path="iot/traceability" element={<TraceabilityPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthContext.Provider>
  );
}

export default App;
