import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts';
import api, { registerLivestock, checkLivestockHealth, getLivestockSchedule } from '../../api/healthApi';

// Add new API function directly since we can't easily modify the API file here
const getLivestock = (farmId) => api.get(`/health/livestock?farm_id=${farmId}`);

export default function LivestockPage() {
  const navigate = useNavigate();
  const farmId = localStorage.getItem('farmId');
  
  const [livestockList, setLivestockList] = useState([]);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  
  // Registration form
  const [animalType, setAnimalType] = useState('cow');
  const [tagId, setTagId] = useState('');
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  
  // Health check
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [healthResult, setHealthResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  
  const [initialLoading, setInitialLoading] = useState(true);

  // Edit Modes
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [editScheduleData, setEditScheduleData] = useState([]);
  
  const [isEditingYield, setIsEditingYield] = useState(false);
  const [editYieldData, setEditYieldData] = useState([]);
  const [newYieldEntry, setNewYieldEntry] = useState({ date: new Date().toISOString().split('T')[0], liters: '' });

  // Load existing livestock on mount
  useEffect(() => {
    if (!farmId) {
      setInitialLoading(false);
      return;
    }
    
    getLivestock(farmId)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        setLivestockList(data);
        if (data.length > 0) {
          handleSelectAnimal(data[0]);
        }
      })
      .catch(err => {
        console.error("Failed to fetch livestock", err);
      })
      .finally(() => {
        setInitialLoading(false);
      });
  }, [farmId]);

  const handleSaveSchedule = async () => {
    try {
      setIsEditingSchedule(false);
      const res = await updateLivestock(selectedAnimal.id, { vaccination_schedule: editScheduleData });
      setSelectedAnimal(prev => ({ ...prev, ...res.data }));
      setLivestockList(prevList => prevList.map(item => item.id === selectedAnimal.id ? { ...item, ...res.data } : item));
    } catch (e) {
      alert("Failed to update schedule");
    }
  };
  
  const handleSaveYield = async () => {
    try {
      setIsEditingYield(false);
      const res = await updateLivestock(selectedAnimal.id, { milk_yield_log: editYieldData });
      setSelectedAnimal(prev => ({ ...prev, ...res.data }));
      setLivestockList(prevList => prevList.map(item => item.id === selectedAnimal.id ? { ...item, ...res.data } : item));
    } catch (e) {
      alert("Failed to update yield data");
    }
  };

  const addYieldEntry = () => {
    if (!newYieldEntry.liters) return;
    setEditYieldData([...editYieldData, { ...newYieldEntry, liters: parseFloat(newYieldEntry.liters) }]);
    setNewYieldEntry({ date: new Date().toISOString().split('T')[0], liters: '' });
  };

  const handleSelectAnimal = async (animal) => {
    setSelectedAnimal(animal);
    setHealthResult(null);
    setFile(null);
    setPreviewUrl(null);
    
    // Ensure schedule is loaded
    if (animal && !animal.vaccination_schedule) {
      try {
        const res = await getLivestockSchedule(animal.id);
        setSelectedAnimal(prev => ({ ...prev, ...res.data }));
        
        // Update list as well
        setLivestockList(prevList => 
          prevList.map(item => item.id === animal.id ? { ...item, ...res.data } : item)
        );
      } catch (e) {
        console.error("Failed to fetch schedule for", animal.id);
      }
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!farmId) {
      setError("No farm ID found. Please set up your farm first.");
      return;
    }
    
    setRegistering(true);
    setError('');
    
    try {
      const res = await registerLivestock({
        farm_id: farmId,
        animal_type: animalType,
        tag_id: tagId
      });
      
      const newAnimal = res.data;
      setLivestockList(prev => [newAnimal, ...prev]);
      handleSelectAnimal(newAnimal);
      setTagId('');
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to register livestock');
    } finally {
      setRegistering(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setHealthResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file || !selectedAnimal) return;
    setAnalyzing(true);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await checkLivestockHealth(selectedAnimal.id, formData);
      setHealthResult(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to analyze health');
    } finally {
      setAnalyzing(false);
    }
  };

  const yieldData = selectedAnimal?.milk_yield_log || [];
  const schedData = selectedAnimal?.vaccination_schedule || [];

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col pt-20 px-margin items-center justify-center">
        <span className="material-symbols-outlined text-[48px] text-primary animate-spin">refresh</span>
        <p className="mt-4 font-body-lg text-on-surface-variant">Loading registry...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-28">
      {/* Header */}
      <div className="pt-20 px-margin pb-4">
        <h1 className="font-headline-md text-headline-md text-on-surface">Livestock Health</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">Manage herd registry & vaccination schedule</p>
      </div>

      <main className="flex flex-col px-margin gap-space-lg">
        {/* Horizontal scrollable animal selector */}
        {livestockList.length > 0 && (
          <div className="flex flex-col gap-space-sm">
            <h2 className="font-label-lg text-label-lg font-bold text-on-surface">Your Herd</h2>
            <div className="flex overflow-x-auto gap-space-md pb-2 -mx-margin px-margin hide-scrollbar snap-x">
              {livestockList.map(animal => {
                const isSelected = selectedAnimal?.id === animal.id;
                
                // Choose icon based on animal type
                let icon = 'pets';
                if (animal.animal_type === 'cow') icon = 'cruelty_free';
                if (animal.animal_type === 'poultry') icon = 'egg';
                
                return (
                  <button
                    key={animal.id}
                    onClick={() => handleSelectAnimal(animal)}
                    className={`snap-center shrink-0 w-32 h-32 rounded-2xl p-space-sm flex flex-col items-center justify-center gap-2 transition-all border ${
                      isSelected 
                        ? 'bg-primary-container text-on-primary-container border-primary shadow-sm scale-100' 
                        : 'bg-surface-container border-outline-variant text-on-surface-variant scale-95 opacity-80 hover:opacity-100'
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[36px]" style={isSelected ? {fontVariationSettings: "'FILL' 1"} : {}}>
                      {icon}
                    </span>
                    <div className="text-center">
                      <p className="font-label-md text-label-md font-bold capitalize">{animal.animal_type}</p>
                      <p className="font-body-sm text-[11px] opacity-80 truncate w-24">#{animal.tag_id}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Dashboard for selected animal */}
        {selectedAnimal ? (
          <div className="flex flex-col gap-space-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 gap-space-md">
              <div className="bg-surface-container-low rounded-2xl p-space-md border border-outline-variant/30 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-primary mb-1 text-[28px]">calendar_month</span>
                <p className="font-body-sm text-[11px] text-on-surface-variant">Breeding Event</p>
                <p className="font-label-md text-label-md font-bold text-on-surface mt-1">
                  {selectedAnimal.breeding_cycle?.next_expected_event 
                    ? new Date(selectedAnimal.breeding_cycle.next_expected_event).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})
                    : 'N/A'
                  }
                </p>
              </div>
              
              <div className="bg-surface-container-low rounded-2xl p-space-md border border-outline-variant/30 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-secondary mb-1 text-[28px]">water_drop</span>
                <p className="font-body-sm text-[11px] text-on-surface-variant">Yield Status</p>
                <p className="font-label-md text-label-md font-bold text-on-surface mt-1">
                  {yieldData.length > 0 ? `${yieldData[yieldData.length-1].liters} L/day` : 'Tracking...'}
                </p>
              </div>
            </div>

            {/* Health Check Action */}
            <div className="bg-primary-fixed/20 border border-primary-fixed rounded-3xl p-space-md flex flex-col gap-space-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="material-symbols-outlined text-[100px] text-primary" style={{fontVariationSettings: "'FILL' 1"}}>stethoscope</span>
              </div>
              <h3 className="font-title-md text-title-md text-on-surface relative z-10">AI Health Scanner</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant relative z-10 mb-2">
                Upload a photo of {selectedAnimal.tag_id}'s skin, eyes, or posture for instant diagnosis.
              </p>
              
              {!file ? (
                <label className="w-full bg-primary text-on-primary rounded-xl py-3 font-label-lg font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95 transition-transform relative z-10">
                  <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
                  Take Photo
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                </label>
              ) : (
                <div className="flex flex-col gap-space-sm relative z-10">
                  <div className="relative w-full h-48 rounded-xl overflow-hidden bg-black">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => { setFile(null); setPreviewUrl(null); setHealthResult(null); }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                  
                  {!healthResult ? (
                    <button 
                      onClick={handleAnalyze} 
                      disabled={analyzing}
                      className="w-full bg-primary text-on-primary rounded-xl py-3 font-label-lg font-bold flex items-center justify-center gap-2 shadow-md"
                      type="button"
                    >
                      {analyzing ? (
                        <><span className="material-symbols-outlined animate-spin text-[20px]">refresh</span> Scanning...</>
                      ) : (
                        <><span className="material-symbols-outlined text-[20px]">memory</span> Run AI Analysis</>
                      )}
                    </button>
                  ) : (
                    <div className="bg-surface-container-lowest p-space-sm rounded-xl border border-outline-variant mt-2">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${healthResult.vet_booking_requested ? 'bg-error-container text-on-error-container' : 'bg-primary-container text-on-primary-container'}`}>
                          <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>
                            {healthResult.vet_booking_requested ? 'emergency' : 'verified'}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-label-lg font-bold text-on-surface">{healthResult.predicted_condition}</h4>
                          <p className="font-body-sm text-on-surface-variant mt-1">
                            {Math.round(healthResult.confidence * 100)}% Confidence Match
                          </p>
                          {healthResult.vet_booking_requested && (
                            <button className="mt-3 px-4 py-2 bg-error text-on-error rounded-lg font-label-md w-full shadow-sm" type="button">
                              Book Vet Appointment
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Vaccination Schedule */}
            <div className="flex flex-col gap-space-sm relative">
              <div className="absolute top-[5px] right-0 z-10">
                <button 
                  onClick={() => {
                    if (isEditingSchedule) {
                      handleSaveSchedule();
                    } else {
                      setEditScheduleData([...schedData]);
                      setIsEditingSchedule(true);
                    }
                  }} 
                  className="text-primary font-label-sm font-bold flex items-center gap-1 bg-surface-container/50 px-2 py-1 rounded-lg"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">{isEditingSchedule ? 'save' : 'edit'}</span>
                  {isEditingSchedule ? 'Save' : 'Edit'}
                </button>
              </div>
              <h3 className="font-title-md text-title-md font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[22px]" style={{fontVariationSettings: "'FILL' 1"}}>vaccines</span>
                Vaccination Plan
              </h3>
              
              {isEditingSchedule ? (
                <div className="flex flex-col gap-2">
                  {editScheduleData.map((v, i) => (
                    <div key={i} className="flex gap-2 items-center bg-surface-container-lowest p-2 rounded-xl border border-outline-variant">
                      <input 
                        type="text" 
                        value={v.vaccine} 
                        onChange={e => {
                          const newD = [...editScheduleData];
                          newD[i].vaccine = e.target.value;
                          setEditScheduleData(newD);
                        }}
                        className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface w-full min-w-0"
                        placeholder="Vaccine Name"
                      />
                      <input 
                        type="date" 
                        value={v.due_date ? v.due_date.split('T')[0] : ''} 
                        onChange={e => {
                          const newD = [...editScheduleData];
                          newD[i].due_date = e.target.value;
                          setEditScheduleData(newD);
                        }}
                        className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface w-full min-w-0"
                      />
                      <button 
                        onClick={() => setEditScheduleData(editScheduleData.filter((_, idx) => idx !== i))}
                        className="text-error p-2 shrink-0 bg-error-container/20 rounded-lg"
                        type="button"
                      ><span className="material-symbols-outlined text-[20px]">delete</span></button>
                    </div>
                  ))}
                  <button 
                    onClick={() => setEditScheduleData([...editScheduleData, {vaccine: '', due_date: new Date().toISOString().split('T')[0]}])}
                    className="text-primary font-bold text-sm flex items-center justify-center gap-1 mt-2 py-2 border border-dashed border-primary rounded-lg hover:bg-primary-container/20 transition-colors"
                    type="button"
                  ><span className="material-symbols-outlined text-[18px]">add</span> Add Row</button>
                </div>
              ) : schedData.length > 0 ? (
                <div className="flex flex-col gap-2">
                {schedData.map((v, i) => {
                  // Decide color based on date closeness for demo purposes
                  const isPast = new Date(v.due_date) < new Date();
                  
                  return (
                    <div key={i} className="flex justify-between items-center bg-surface-container-lowest p-space-sm rounded-xl border border-outline-variant">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-high`}>
                          <span className="material-symbols-outlined text-[20px] text-on-surface-variant">syringe</span>
                        </div>
                        <div>
                          <p className="font-label-md text-label-md font-bold text-on-surface">{v.vaccine}</p>
                          <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">
                            {new Date(v.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric'})}
                          </p>
                        </div>
                      </div>
                      {isPast ? (
                        <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant rounded-full font-label-sm font-bold text-[10px] uppercase">
                          Done
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full font-label-sm font-bold text-[10px] uppercase shadow-sm">
                          Upcoming
                        </span>
                      )}
                    </div>
                  );
                })}
                </div>
              ) : (
                <div className="bg-surface-container rounded-xl p-space-md text-center">
                  <p className="font-body-sm text-on-surface-variant">No schedule found. Click Edit to add vaccines.</p>
                </div>
              )}
            </div>
            
            {/* Yield Chart */}
            <div className="flex flex-col gap-space-sm relative">
              <div className="absolute top-[5px] right-0 z-10">
                <button 
                  onClick={() => {
                    if (isEditingYield) {
                      handleSaveYield();
                    } else {
                      setEditYieldData([...yieldData]);
                      setIsEditingYield(true);
                    }
                  }} 
                  className="text-tertiary font-label-sm font-bold flex items-center gap-1 bg-surface-container/50 px-2 py-1 rounded-lg"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">{isEditingYield ? 'save' : 'edit'}</span>
                  {isEditingYield ? 'Save' : 'Edit'}
                </button>
              </div>
              <h3 className="font-title-md text-title-md font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-[22px]" style={{fontVariationSettings: "'FILL' 1"}}>monitoring</span>
                Yield History
              </h3>
              
              {isEditingYield ? (
                <div className="bg-surface-container-lowest rounded-2xl p-space-md border border-outline-variant flex flex-col gap-3">
                  {editYieldData.map((y, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input 
                        type="date" 
                        value={y.date} 
                        onChange={e => {
                          const newD = [...editYieldData];
                          newD[i].date = e.target.value;
                          setEditYieldData(newD);
                        }}
                        className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface"
                      />
                      <input 
                        type="number" 
                        value={y.liters} 
                        onChange={e => {
                          const newD = [...editYieldData];
                          newD[i].liters = parseFloat(e.target.value) || 0;
                          setEditYieldData(newD);
                        }}
                        className="w-24 bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface"
                        step="0.1"
                      />
                      <span className="text-on-surface-variant text-sm">L</span>
                      <button 
                        onClick={() => setEditYieldData(editYieldData.filter((_, idx) => idx !== i))}
                        className="text-error p-2 shrink-0 bg-error-container/20 rounded-lg ml-auto"
                        type="button"
                      ><span className="material-symbols-outlined text-[20px]">delete</span></button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-outline-variant/30">
                    <input 
                      type="date" 
                      value={newYieldEntry.date} 
                      onChange={e => setNewYieldEntry({...newYieldEntry, date: e.target.value})}
                      className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface"
                    />
                    <input 
                      type="number" 
                      value={newYieldEntry.liters} 
                      onChange={e => setNewYieldEntry({...newYieldEntry, liters: e.target.value})}
                      placeholder="Liters"
                      className="w-24 bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface"
                      step="0.1"
                    />
                    <button 
                      onClick={addYieldEntry}
                      className="text-on-primary bg-primary p-2 shrink-0 rounded-lg shadow-sm"
                      type="button"
                    ><span className="material-symbols-outlined text-[20px]">add</span></button>
                  </div>
                </div>
              ) : yieldData.length > 0 ? (
                <div className="bg-surface-container-lowest rounded-2xl p-space-md border border-outline-variant h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={yieldData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--md-sys-color-outline-variant)" opacity={0.5} />
                      <XAxis dataKey="date" tick={{fontSize: 10, fill: 'var(--md-sys-color-on-surface-variant)'}} tickLine={false} axisLine={false} />
                      <YAxis tick={{fontSize: 10, fill: 'var(--md-sys-color-on-surface-variant)'}} tickLine={false} axisLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: 'var(--md-sys-color-primary)', fontWeight: 'bold' }}
                      />
                      <Line type="monotone" dataKey="liters" stroke="var(--md-sys-color-primary)" strokeWidth={3} dot={{r: 4, strokeWidth: 0, fill: 'var(--md-sys-color-primary)'}} activeDot={{r: 6}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="bg-surface-container rounded-xl p-space-md text-center">
                  <p className="font-body-sm text-on-surface-variant">No yield data tracked yet. Click Edit to add data.</p>
                </div>
              )}
            </div>
            
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in">
            <span className="material-symbols-outlined text-[64px] text-surface-container-highest mb-4">pets</span>
            <p className="font-headline-sm text-on-surface mb-2">No Livestock Selected</p>
            <p className="font-body-md text-on-surface-variant">Register a new animal below to start tracking health and schedules.</p>
          </div>
        )}
        
        {/* Registration Section */}
        <div className="bg-surface-container-low rounded-3xl p-space-md flex flex-col gap-space-md shadow-sm">
          <h2 className="font-title-md font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">add_circle</span>
            Register New Animal
          </h2>
          
          <form onSubmit={handleRegister} className="flex flex-col gap-space-sm">
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-on-surface-variant pl-1">Animal Type</label>
              <div className="relative">
                <select 
                  value={animalType} 
                  onChange={e => setAnimalType(e.target.value)}
                  className="w-full h-14 bg-surface-container-lowest border border-outline-variant rounded-xl px-4 appearance-none focus:border-primary focus:ring-1 focus:ring-primary outline-none font-body-lg text-on-surface capitalize"
                >
                  <option value="cow">Cow</option>
                  <option value="buffalo">Buffalo</option>
                  <option value="goat">Goat</option>
                  <option value="poultry">Poultry</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-on-surface-variant pl-1">Tag ID / Name</label>
              <input 
                type="text"
                value={tagId} 
                onChange={e => setTagId(e.target.value)}
                placeholder="e.g. TAG-492"
                required
                className="w-full h-14 bg-surface-container-lowest border border-outline-variant rounded-xl px-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-body-lg text-on-surface"
              />
            </div>
            
            {error && <p className="font-body-sm text-error px-1">{error}</p>}
            
            <button 
              type="submit" 
              disabled={registering}
              className="mt-2 w-full h-14 bg-primary text-on-primary rounded-xl font-label-lg font-bold shadow-sm active:scale-95 transition-transform flex justify-center items-center gap-2"
            >
              {registering ? (
                <><span className="material-symbols-outlined animate-spin text-[20px]">refresh</span> Registering...</>
              ) : (
                'Register Animal'
              )}
            </button>
          </form>
        </div>

      </main>
    </div>
  );
}
