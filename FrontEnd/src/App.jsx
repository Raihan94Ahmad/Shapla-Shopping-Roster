import React, { useState } from 'react';
import { Printer, AlertCircle, Sliders, Zap, Fuel, Building, AlertTriangle, Upload, Code } from 'lucide-react';

const initialData = {
  "_story": "Shapla Shopping Complex, Thursday. DESCO load shedding 12:00-16:00 and 17:00-20:00. 20 kW generator, 17 litres of diesel, twelve shops.",
  "grid_available": [true, true, false, false, false, false, true, false, false, false],
  "generator_capacity_kw": 20,
  "fuel_budget_litres": 17.0,
  "fuel_table": [
    { "load_kw": 7, "litres_per_hour": 1.2 },
    { "load_kw": 14, "litres_per_hour": 2.0 },
    { "load_kw": 20, "litres_per_hour": 2.8 }
  ],
  "max_consecutive_dark": 2,
  "shops": [
    { "id": "pharmacy", "kw": 3, "type": "mandatory", "value_per_slot": [6, 6, 6, 6, 6, 6, 6, 6, 6, 6] },
    { "id": "atm_booth", "kw": 2, "type": "mandatory", "value_per_slot": [4, 4, 4, 4, 4, 4, 4, 4, 4, 4] },
    { "id": "tailor_jamal", "kw": 4, "type": "normal", "value_per_slot": [2, 2, 3, 3, 4, 4, 4, 4, 5, 5] },
    { "id": "mobile_shop", "kw": 3, "type": "normal", "value_per_slot": [1, 1, 2, 2, 2, 3, 4, 6, 8, 8] },
    { "id": "photocopy", "kw": 2, "type": "normal", "value_per_slot": [3, 3, 5, 5, 4, 3, 2, 2, 1, 1] },
    { "id": "tea_stall", "kw": 1, "type": "normal", "value_per_slot": [2, 2, 3, 3, 3, 2, 2, 3, 3, 3] },
    { "id": "beauty_salon", "kw": 4, "type": "normal", "value_per_slot": [1, 1, 2, 3, 4, 5, 5, 4, 3, 2] },
    { "id": "grocery_fridge", "kw": 3, "type": "normal", "value_per_slot": [3, 3, 3, 3, 3, 3, 4, 5, 5, 4] },
    { "id": "electronics", "kw": 5, "type": "normal", "value_per_slot": [1, 1, 2, 2, 3, 3, 5, 6, 7, 6] },
    { "id": "restaurant", "kw": 6, "type": "normal", "value_per_slot": [2, 3, 6, 7, 5, 3, 3, 5, 7, 8] },
    { "id": "jewellery", "kw": 3, "type": "normal", "value_per_slot": [1, 2, 3, 3, 3, 3, 4, 5, 5, 3] },
    { "id": "clothing", "kw": 2, "type": "normal", "value_per_slot": [2, 2, 3, 3, 3, 4, 5, 5, 4, 3] }
  ]
};

export default function App() {
  const [config, setConfig] = useState(initialData);
  const [jsonString, setJsonString] = useState(JSON.stringify(initialData, null, 2));
  const [outputData, setOutputData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('visual');

  const hours = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

  const syncConfig = (newConfig) => {
    setConfig(newConfig);
    setJsonString(JSON.stringify(newConfig, null, 2));
  };

  const handleGenerateRoster = async () => {
    try {
      setErrorMsg('');
      const response = await fetch('http://127.0.0.1:8000/api/roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Server error');
      setOutputData(data);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const toggleGridHour = (index) => {
    const updatedGrid = [...config.grid_available];
    updatedGrid[index] = !updatedGrid[index];
    syncConfig({ ...config, grid_available: updatedGrid });
  };

  const handleJsonTextChange = (e) => {
    const val = e.target.value;
    setJsonString(val);
    try {
      const parsed = JSON.parse(val);
      setConfig(parsed);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg('Invalid JSON format');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        syncConfig(parsed);
        setErrorMsg('');
      } catch (err) {
        setErrorMsg('Invalid JSON File');
      }
    };
    reader.readAsText(file);
  };

  const getShopStatus = (shopId, hourIdx) => {
    if (config.grid_available[hourIdx] === true) {
      return { text: "⚡ Grid", reason: "National grid power is active." };
    }
    if (!outputData || !outputData.roster) {
      return { text: "-", reason: "No roster data" };
    }
    
    const hourData = outputData.roster.find(r => r.hour === hourIdx);
    if (!hourData) return { text: "-", reason: "No data for this hour" };
    
    if (hourData.powered.includes(shopId)) {
      return { text: "✔ Gen On", reason: "Shop is powered by generator." };
    }
    
    const darkEntry = hourData.dark.find(d => d.id === shopId);
    const reasonText = darkEntry ? darkEntry.reason : "Shop kept dark due to capacity/fuel budget limits.";
    
    return { text: "✗ Off", reason: reasonText };
  };

  const fuelUsagePercentage = outputData ? (outputData.fuel_total_litres / config.fuel_budget_litres) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 print:p-0 print:bg-white">
      <div className="max-w-7xl mx-auto space-y-6 print:space-y-4">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4 bg-white p-4 rounded-xl shadow-sm print:shadow-none print:p-0 print:border-black">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 print:text-xl">
              <Building className="text-blue-600 print:hidden" /> Who Stays On? - Shapla Shopping Complex
            </h1>
            <p className="text-sm text-gray-600 print:text-xs">Generator Load Shedding Roster & Management Dashboard</p>
          </div>
          <button 
            onClick={() => window.print()} 
            className="flex items-center gap-2 bg-gray-200 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 print:hidden"
          >
            <Printer size={18} /> Print View (A4)
          </button>
        </div>

        {/* Critical Fuel Warning */}
        {outputData && fuelUsagePercentage >= 90 && (
          <div className="p-4 bg-red-100 border border-red-300 text-red-800 rounded-xl flex items-center gap-3 print:hidden">
            <AlertTriangle className="text-red-600 shrink-0" size={24} />
            <div>
              <p className="font-bold">Critical Fuel Alert!</p>
              <p className="text-xs">{fuelUsagePercentage.toFixed(1)}% of total fuel budget has been used.</p>
            </div>
          </div>
        )}

        {/* Control Panel */}
        <div className="bg-white p-5 rounded-xl shadow border space-y-4 print:hidden">
          <div className="flex justify-between items-center border-b pb-3">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Sliders size={20} className="text-emerald-600" /> Control Panel
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setActiveTab('visual')}
                className={`px-3 py-1 text-sm rounded-lg font-medium ${activeTab === 'visual' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                Visual Controls
              </button>
              <button 
                onClick={() => setActiveTab('json')}
                className={`px-3 py-1 text-sm rounded-lg font-medium ${activeTab === 'json' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                JSON Editor / Upload
              </button>
            </div>
          </div>

          {activeTab === 'visual' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg bg-gray-50 space-y-1">
                  <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                    <Zap size={14} className="text-amber-500" /> Generator Capacity (kW): <span className="text-blue-600 text-sm font-bold">{config.generator_capacity_kw} kW</span>
                  </label>
                  <input 
                    type="range" 
                    min="10" 
                    max="50" 
                    value={config.generator_capacity_kw} 
                    onChange={(e) => syncConfig({ ...config, generator_capacity_kw: Number(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div className="p-3 border rounded-lg bg-gray-50 space-y-1">
                  <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                    <Fuel size={14} className="text-red-500" /> Fuel Budget (Litres): <span className="text-blue-600 text-sm font-bold">{config.fuel_budget_litres} L</span>
                  </label>
                  <input 
                    type="range" 
                    min="5" 
                    max="50" 
                    step="0.5"
                    value={config.fuel_budget_litres} 
                    onChange={(e) => syncConfig({ ...config, fuel_budget_litres: Number(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>

              <div className="p-3 border rounded-lg bg-gray-50 space-y-2">
                <label className="text-xs font-semibold text-gray-600">Grid Availability (Click to toggle):</label>
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                  {hours.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => toggleGridHour(i)}
                      className={`p-2 text-xs rounded-lg font-bold border transition ${
                        config.grid_available[i] 
                          ? 'bg-blue-100 text-blue-700 border-blue-300' 
                          : 'bg-amber-100 text-amber-700 border-amber-300'
                      }`}
                    >
                      <div>{h}</div>
                      <div className="text-[10px] mt-1">{config.grid_available[i] ? '⚡ Grid' : '🔌 Outage'}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                  <Code size={16} /> JSON Input Config
                </label>
                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs font-semibold flex items-center gap-1">
                  <Upload size={14} /> Upload JSON File
                  <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
              <textarea 
                rows={10} 
                value={jsonString} 
                onChange={handleJsonTextChange}
                className="w-full p-3 font-mono text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-900 text-emerald-400"
              />
            </div>
          )}

          <button 
            onClick={handleGenerateRoster}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition shadow"
          >
            Generate & Optimize Roster
          </button>
          {errorMsg && <p className="text-red-600 text-sm flex items-center gap-1 mt-2"><AlertCircle size={16}/> {errorMsg}</p>}
        </div>

        {/* Execution Summary */}
        {outputData && (
          <div className="bg-white p-4 rounded-xl shadow border space-y-3 print:border-black print:shadow-none print:p-2">
            <h2 className="font-semibold text-lg print:text-sm">Execution Summary</h2>
            <div className="grid grid-cols-3 gap-4 print:gap-2">
              <div className="p-3 bg-gray-50 rounded-lg border print:p-2 print:border-black">
                <p className="text-xs text-gray-500">Status</p>
                <p className="text-lg font-bold uppercase text-emerald-600 print:text-black print:text-sm">{outputData.status}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border print:p-2 print:border-black">
                <p className="text-xs text-gray-500">Total Score</p>
                <p className="text-lg font-bold text-blue-600 print:text-black print:text-sm">{outputData.value_total}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border print:p-2 print:border-black">
                <p className="text-xs text-gray-500">Total Fuel Used</p>
                <p className="text-lg font-bold text-amber-600 print:text-black print:text-sm">{outputData.fuel_total_litres} / {config.fuel_budget_litres} L</p>
              </div>
            </div>
          </div>
        )}

        {/* Roster Board Table */}
        {outputData && config.shops && config.shops.length > 0 && (
          <div className="bg-white p-4 rounded-xl shadow border overflow-x-auto print:shadow-none print:border-none print:p-0">
            <h2 className="font-semibold text-lg mb-1 print:text-sm print:mb-2">Roster Board</h2>
            <p className="text-xs text-gray-500 mb-4">💡 Hover over any red cell (✗ Off) to view the specific reason for keeping it dark.</p>
            <table className="w-full border-collapse text-xs print:text-[10px]">
              <thead>
                <tr className="bg-gray-100 border-b print:bg-gray-200">
                  <th className="p-2 text-left border print:border-black">Shop Name</th>
                  {hours.map((h, i) => (
                    <th key={i} className="p-2 text-center border print:border-black">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {config.shops.map((shop) => (
                  <tr key={shop.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 border font-medium print:border-black">
                      {shop.id} <span className="text-[10px] text-gray-500 print:text-black">({shop.kw}kW)</span>
                    </td>
                    {hours.map((_, hourIdx) => {
                      const status = getShopStatus(shop.id, hourIdx);
                      return (
                        <td 
                          key={hourIdx} 
                          title={status.reason} 
                          className={`p-2 text-center border font-semibold cursor-pointer print:border-black ${
                            status.text.includes("Grid") ? "text-blue-600 bg-blue-50 print:bg-transparent print:text-black" : 
                            status.text.includes("Gen On") ? "text-emerald-700 bg-emerald-50 print:bg-transparent print:text-black" : "text-red-600 bg-red-50 print:bg-transparent print:text-black"
                          }`}
                        >
                          {status.text}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}