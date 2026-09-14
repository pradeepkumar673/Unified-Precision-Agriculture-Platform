import { Routes, Route, Link, useLocation } from 'react-router-dom';
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

function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-emerald-500/30">
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2 shrink-0 pr-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-500/20">
                A
              </div>
              <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">
                AgriPlatform
              </span>
            </div>
            <div className="flex space-x-1 whitespace-nowrap pb-2 mt-2">
              <NavLink to="/farm/profile" current={location.pathname}>Farm Profile</NavLink>
              <NavLink to="/farm/boundary" current={location.pathname}>Boundary</NavLink>
              <NavLink to="/planning/crop-plan" current={location.pathname}>Crop Plan</NavLink>
              <NavLink to="/planning/rotation" current={location.pathname}>Rotation</NavLink>
              <NavLink to="/planning/variable-rate" current={location.pathname}>VRA</NavLink>
              <NavLink to="/health/disease" current={location.pathname}>Diagnostics</NavLink>
              <NavLink to="/health/pest-risk" current={location.pathname}>Surveillance</NavLink>
              <NavLink to="/health/livestock" current={location.pathname}>Livestock</NavLink>
              <NavLink to="/water-soil/irrigation" current={location.pathname}>Irrigation</NavLink>
              <NavLink to="/water-soil/soil-map" current={location.pathname}>Soil Map</NavLink>
              <NavLink to="/vision/satellite" current={location.pathname}>Vision AI</NavLink>
              <NavLink to="/vision/price-forecast" current={location.pathname}>Markets</NavLink>
              <NavLink to="/vision/yield-climate" current={location.pathname}>Yield/Risk</NavLink>
              <NavLink to="/marketplace/inputs" current={location.pathname}>Inputs</NavLink>
              <NavLink to="/marketplace/rentals" current={location.pathname}>Rentals</NavLink>
              <NavLink to="/marketplace/exchange" current={location.pathname}>B2B Exchange</NavLink>
              <NavLink to="/finance/credit-loan" current={location.pathname}>Credit</NavLink>
              <NavLink to="/finance/ledger" current={location.pathname}>Ledger</NavLink>
              <NavLink to="/finance/insurance-warehouse" current={location.pathname}>Insurance</NavLink>
              <NavLink to="/gov/schemes" current={location.pathname}>Gov Schemes</NavLink>
              <NavLink to="/gov/documents" current={location.pathname}>Doc Vault</NavLink>
              <NavLink to="/community/season-report" current={location.pathname}>Season Report</NavLink>
              <NavLink to="/community/grower-score" current={location.pathname}>Reputation</NavLink>
              <NavLink to="/community/fpo" current={location.pathname}>FPO Hub</NavLink>
              <NavLink to="/ai/assistant" current={location.pathname}>Voice AI</NavLink>
              <NavLink to="/ai/causal-lab" current={location.pathname}>Causal Lab</NavLink>
              <NavLink to="/ai/federated-learning" current={location.pathname}>Fed FL</NavLink>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<div className="text-center py-20 text-slate-400">Welcome to the AgriPlatform. Select a module from the nav.</div>} />
          <Route path="/farm/profile" element={<FarmProfilePage />} />
          <Route path="/farm/boundary" element={<FieldBoundaryPage />} />
          <Route path="/planning/crop-plan" element={<CropPlanningPage />} />
          <Route path="/planning/rotation" element={<RotationPage />} />
          <Route path="/planning/variable-rate" element={<VariableRatePage />} />
          <Route path="/health/disease" element={<DiseaseDiagnosisPage />} />
          <Route path="/health/pest-risk" element={<PestRiskPage />} />
          <Route path="/health/livestock" element={<LivestockPage />} />
          <Route path="/water-soil/irrigation" element={<IrrigationPage />} />
          <Route path="/water-soil/soil-map" element={<SoilHealthPage />} />
          <Route path="/vision/satellite" element={<SatelliteVisionPage />} />
          <Route path="/vision/price-forecast" element={<PriceForecastPage />} />
          <Route path="/vision/yield-climate" element={<YieldClimatePage />} />
          <Route path="/marketplace/inputs" element={<InputsMarketplacePage />} />
          <Route path="/marketplace/rentals" element={<MachineryLaborPage />} />
          <Route path="/marketplace/exchange" element={<BuyerExchangePage />} />
          <Route path="/finance/credit-loan" element={<CreditLoanPage />} />
          <Route path="/finance/ledger" element={<LedgerPage />} />
          <Route path="/finance/insurance-warehouse" element={<InsuranceWarehousePage />} />
          <Route path="/gov/schemes" element={<SchemeDiscoveryPage />} />
          <Route path="/gov/documents" element={<DocumentVaultPage />} />
          <Route path="/community/season-report" element={<SeasonReportPage />} />
          <Route path="/community/grower-score" element={<GrowerScorePage />} />
          <Route path="/community/fpo" element={<FPOCommunityPage />} />
          <Route path="/ai/assistant" element={<VoiceAssistantPage />} />
          <Route path="/ai/causal-lab" element={<CausalSimulatorPage />} />
          <Route path="/ai/federated-learning" element={<FederatedLearningPage />} />
        </Routes>
      </main>
    </div>
  );
}

function NavLink({ to, current, children }) {
  const isActive = current.startsWith(to);
  return (
    <Link
      to={to}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'bg-emerald-500/10 text-emerald-400 shadow-[inset_0_-2px_0_rgba(52,211,153,1)]'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
      }`}
    >
      {children}
    </Link>
  );
}

export default App;
