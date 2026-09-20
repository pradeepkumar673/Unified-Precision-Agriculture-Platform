import React, { useState } from 'react';
import api from '../../services/api.js';

const TraceabilityPage = () => {
    const [batchId, setBatchId] = useState('');
    const [traceData, setTraceData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!batchId) return;

        setLoading(true);
        setError('');
        try {
            const res = await api.get(`/cea_iot/traceability?batch_id=${batchId}`);
            setTraceData(res.data);
        } catch (err) {
            console.error(err);
            setError('Could not fetch traceability data. Try another batch ID.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold mb-8">Crop Traceability</h1>

            <form onSubmit={handleSearch} className="flex gap-4 mb-8">
                <input
                    type="text"
                    placeholder="Enter Batch ID (e.g., BATCH-123)"
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </form>

            {error && <div className="text-red-500 bg-red-50 p-4 rounded-lg">{error}</div>}

            {traceData && (
                <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-6 py-4 border-b">
                        <h2 className="text-xl font-bold text-gray-800">Batch Record: {traceData.batch_id}</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Crop</h3>
                                <p className="text-lg font-medium">{traceData.crop}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Sown Date</h3>
                                    <p className="text-md">{traceData.sown_date}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Harvest Date</h3>
                                    <p className="text-md">{traceData.harvest_date}</p>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Quality Grade</h3>
                                <p className="text-lg font-bold text-green-600">{traceData.quality_grade}</p>
                            </div>
                        </div>

                        <div className="space-y-4 bg-gray-50 p-4 rounded-lg border">
                            <h3 className="text-md font-bold text-gray-800 border-b pb-2">Environmental History</h3>
                            <ul className="space-y-2 text-sm">
                                <li className="flex justify-between">
                                    <span className="text-gray-600">Average Temp:</span>
                                    <span className="font-semibold">{traceData.environmental_history.avg_temp} °C</span>
                                </li>
                                <li className="flex justify-between">
                                    <span className="text-gray-600">Average Humidity:</span>
                                    <span className="font-semibold">{traceData.environmental_history.avg_humidity} %</span>
                                </li>
                                <li className="flex justify-between">
                                    <span className="text-gray-600">Anomalies Detected:</span>
                                    <span className="font-semibold text-green-600">{traceData.environmental_history.anomalies}</span>
                                </li>
                            </ul>
                        </div>

                    </div>
                    <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
                        <span className="text-sm text-gray-500">Scan QR Code for public record</span>
                        <a href={traceData.qr_code_data} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm font-medium">
                            {traceData.qr_code_data}
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TraceabilityPage;

