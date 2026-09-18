import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';

const FacilityDashboardPage = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [aquaBalance, setAquaBalance] = useState(null);
    const [verticalOpt, setVerticalOpt] = useState(null);
    const [energyOpt, setEnergyOpt] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [dashRes, aquaRes, vertRes, energyRes] = await Promise.all([
                api.get('/cea_iot/dashboard'),
                api.get('/cea_iot/aqua-balance'),
                api.get('/cea_iot/vertical-optimization'),
                api.get('/cea_iot/energy-optimization'),
            ]);
            setDashboardData(dashRes.data);
            setAquaBalance(aquaRes.data);
            setVerticalOpt(vertRes.data);
            setEnergyOpt(energyRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching CEA IoT data', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return <div className="p-8">Loading Facility Dashboard...</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold mb-8">CEA Facility Dashboard</h1>

            {/* Current Sensor Readings */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold mb-4">Live Sensor Readings</h2>
                {dashboardData?.latest_reading?.data ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-blue-900">Temperature</h3>
                            <p className="text-3xl font-bold text-blue-700">{dashboardData.latest_reading.data.temperature} °C</p>
                        </div>
                        <div className="bg-teal-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-teal-900">Humidity</h3>
                            <p className="text-3xl font-bold text-teal-700">{dashboardData.latest_reading.data.humidity} %</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-purple-900">CO2</h3>
                            <p className="text-3xl font-bold text-purple-700">{dashboardData.latest_reading.data.co2} ppm</p>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-yellow-900">Light Intensity</h3>
                            <p className="text-3xl font-bold text-yellow-700">{dashboardData.latest_reading.data.light_intensity} umol</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-green-900">pH</h3>
                            <p className="text-3xl font-bold text-green-700">{dashboardData.latest_reading.data.ph}</p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-red-900">EC</h3>
                            <p className="text-3xl font-bold text-red-700">{dashboardData.latest_reading.data.ec} mS/cm</p>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-500">Waiting for sensor data...</p>
                )}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Aqua Balance */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold mb-4">Aqua Balance</h2>
                    {aquaBalance && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="font-medium text-gray-700">pH Status</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${aquaBalance.ph_status === 'optimal' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {aquaBalance.ph_status.toUpperCase()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="font-medium text-gray-700">EC Status</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${aquaBalance.ec_status === 'optimal' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {aquaBalance.ec_status.toUpperCase()}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600"><strong>Recommendation:</strong> {aquaBalance.recommendation}</p>
                        </div>
                    )}
                </section>

                {/* Energy Optimization */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold mb-4">Energy Optimization</h2>
                    {energyOpt && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-sm font-semibold text-gray-500">Current Consumption</h3>
                                    <p className="text-2xl font-bold">{energyOpt.current_consumption_kw} kW</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-sm font-semibold text-gray-500">Forecast Consumption</h3>
                                    <p className="text-2xl font-bold">{energyOpt.forecast_consumption_kw} kW</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                <strong>Tip:</strong> {energyOpt.recommendation}
                            </p>
                        </div>
                    )}
                </section>
            </div>

            {/* Vertical Optimization */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold mb-4">Vertical Optimization</h2>
                {verticalOpt && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {verticalOpt.layers.map((layer) => (
                                <div key={layer.layer} className="bg-gray-50 border p-4 rounded-lg">
                                    <h3 className="font-bold mb-2">Layer {layer.layer}</h3>
                                    <div className="text-sm space-y-1">
                                        <p><span className="text-gray-500">Light:</span> {layer.light_intensity} umol</p>
                                        <p><span className="text-gray-500">Temp:</span> {layer.temp} °C</p>
                                        <p><span className="text-gray-500">Status:</span> <span className="text-green-600 font-semibold">{layer.status}</span></p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <strong>Insight:</strong> {verticalOpt.recommendation}
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default FacilityDashboardPage;
