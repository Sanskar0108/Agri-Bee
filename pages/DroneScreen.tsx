import React, { useState, useEffect, useRef } from 'react';
import { SideMenu } from '../components/SideMenu';
import { AIChatBot } from '../components/AIChatBot';
import { Page } from '../App';
import { GoogleGenAI, Type } from '@google/genai';
import { 
  Crosshair, Zap, Wind, Map as MapIcon, Play, RotateCcw, 
  CheckCircle, AlertTriangle, BarChart3, FileText, 
  ThermometerSun, Wifi, Target, Info, CloudLightning, ShieldAlert,
  ArrowUp, ArrowDown, Navigation, Pause, Power, Battery, Activity, Gauge, Bug,
  Droplets, Flower, Sprout, Scan, Settings, Home, Leaf, X, Shuffle, Maximize2, 
  Check, MapPin, Signal, Radio
} from 'lucide-react';

interface DroneScreenProps {
  onNavigate: (page: Page) => void;
  currentTab: string;
  userName?: string;
}

// Types for the AI Simulation Response
interface SimulationData {
  flightPlan: {
    estimatedTime: string;
    batteryEstimate: string;
    coverageEfficiency: string;
  };
  diagnosis: {
    pollinationSuccess: number;
    pestDetection: string;
    detectedPests: Array<{
      name: string;
      location: string;
      severity: string;
      impact: string;
    }>;
    nutrientImbalance: string;
  };
  zones: Array<{
    id: string;
    health: number;
    pollination: number;
    risk: string;
    explanation: string;
    needsSpray?: boolean;
    needsPollination?: boolean;
  }>;
  decisions: {
    spraying: string;
    intervention: string;
    safeToFly: boolean;
  };
  report: {
    farmerSimple: string;
    technicalExpert: string;
  };
  future: {
    yieldForecast: string;
    riskProjection: string;
  };
}

type FlightPhase = 'ground' | 'taking_off' | 'hovering' | 'scanning' | 'analyzing' | 'returning' | 'landing' | 'report';

export const DroneScreen: React.FC<DroneScreenProps> = ({ onNavigate, currentTab, userName }) => {
  const [flightPhase, setFlightPhase] = useState<FlightPhase>('ground');
  const [scanProgress, setScanProgress] = useState(0);
  const [droneData, setDroneData] = useState<SimulationData | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [weatherAlert, setWeatherAlert] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  
  // Zone Interaction State
  const [selectedZone, setSelectedZone] = useState<any | null>(null);
  const [deployingAction, setDeployingAction] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Telemetry State
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [altitude, setAltitude] = useState(0);
  const [signalStrength, setSignalStrength] = useState(100);
  const [horizontalSpeed, setHorizontalSpeed] = useState(0);
  
  // Simulation Environment Settings
  const [envSettings, setEnvSettings] = useState({
    fieldSize: '5 hectares',
    crop: 'Tomato',
    season: 'Mid-flowering',
    battery: '35 mins',
    wind: '11', // stored as number string for easier toggling
    altitudeTarget: '25m',
    temperature: '28',
    humidity: '60'
  });

  // Refs for intervals to clear them properly
  const batteryInterval = useRef<any>(null);
  const scanInterval = useRef<any>(null);

  // --- EFFECTS ---

  // Battery Drain Logic
  useEffect(() => {
    if (flightPhase !== 'ground' && flightPhase !== 'report') {
      batteryInterval.current = setInterval(() => {
        setBatteryLevel(prev => Math.max(0, prev - (flightPhase === 'scanning' ? 0.3 : 0.1)));
      }, 1000);
    } else {
        if(batteryInterval.current) clearInterval(batteryInterval.current);
    }
    return () => {
        if(batteryInterval.current) clearInterval(batteryInterval.current);
    };
  }, [flightPhase]);

  // Signal & Speed Simulation Logic
  useEffect(() => {
    // Signal Fluctuation
    const signalInt = setInterval(() => {
        setSignalStrength(prev => {
             const change = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
             let next = prev + change;
             if (next > 100) next = 100;
             if (next < 85) next = 85; 
             return next;
        });
    }, 1500);

    // Speed Logic
    if (flightPhase === 'scanning') setHorizontalSpeed(5.2);
    else if (flightPhase === 'returning') setHorizontalSpeed(8.5);
    else if (flightPhase === 'taking_off' || flightPhase === 'landing') setHorizontalSpeed(0);
    else if (flightPhase === 'hovering') setHorizontalSpeed(0);
    else setHorizontalSpeed(0);

    return () => clearInterval(signalInt);
  }, [flightPhase]);

  // Altitude Simulation Logic
  useEffect(() => {
    let interval: any;

    if (flightPhase === 'taking_off') {
      // Climbing
      interval = setInterval(() => {
        setAltitude(prev => {
            const next = prev + 0.5;
            return next > 25 ? 25 : next;
        });
      }, 50);
    } else if (flightPhase === 'landing') {
      // Descending
      interval = setInterval(() => {
        setAltitude(prev => {
            const next = prev - 0.5;
            return next < 0 ? 0 : next;
        });
      }, 50);
    }

    return () => clearInterval(interval);
  }, [flightPhase]);

  // Phase Transition Logic based on Altitude
  useEffect(() => {
      if (flightPhase === 'taking_off' && altitude >= 25) {
          setFlightPhase('hovering');
          addLog("Target altitude reached (25m). Holding position.");
      }
      if (flightPhase === 'landing' && altitude <= 0) {
          setFlightPhase('ground');
          addLog("Touchdown confirmed. Motors disarmed.");
      }
  }, [altitude, flightPhase]);

  const toggleStormMode = () => {
    setEnvSettings(prev => ({
        ...prev,
        wind: prev.wind === '11' ? '45' : '11'
    }));
  };

  const randomizeWeather = () => {
    const randomTemp = Math.floor(Math.random() * 35) + 15; // 15-50
    const randomHum = Math.floor(Math.random() * 60) + 30; // 30-90
    const randomWind = Math.floor(Math.random() * 35); // 0-35
    
    setEnvSettings(prev => ({
        ...prev,
        temperature: randomTemp.toString(),
        humidity: randomHum.toString(),
        wind: randomWind.toString()
    }));
  };

  const addLog = (text: string) => {
    setLogs(prev => [...(prev || []).slice(-4), text]);
  };

  // --- ACTIONS ---

  const checkWeather = () => {
    const currentWind = parseInt(envSettings.wind);
    if (currentWind > 20) {
        setWeatherAlert(true);
        addLog(`⚠️ High Wind Alert: ${currentWind} km/h`);
        return false;
    }
    return true;
  };

  const handleTakeOff = () => {
    if (!checkWeather()) return;
    if (flightPhase !== 'ground') return;
    
    setDroneData(null); // Reset previous data
    setLogs([]);
    addLog("AgriBee Phase-2 System Initiated.");
    addLog("Pre-flight checks passed.");
    addLog("Arming motors...");
    setFlightPhase('taking_off');
  };

  const handleLand = () => {
    if (flightPhase === 'ground') return;
    addLog("Initiating landing sequence...");
    // Stop any scanning
    if(scanInterval.current) clearInterval(scanInterval.current);
    setFlightPhase('landing');
  };

  const handleReturnToBase = () => {
    if (flightPhase === 'ground') return;
    addLog("Return to Base (RTH) Triggered.");
    // Stop any scanning
    if(scanInterval.current) clearInterval(scanInterval.current);
    setFlightPhase('returning');
    
    // Simulate return travel time then land
    setTimeout(() => {
        addLog("Home Point Reached.");
        setFlightPhase('landing');
    }, 2000);
  };

  const handleHover = () => {
      if (flightPhase === 'ground') return;
      
      if (flightPhase === 'hovering') {
          addLog("Already holding position.");
          return;
      }
      
      // Pause whatever we are doing (scanning, taking off, etc)
      addLog("Holding position (Hover Mode).");
      if(scanInterval.current) clearInterval(scanInterval.current);
      setFlightPhase('hovering');
  };

  const startAutonomousMission = async () => {
    // If on ground, takeoff first
    if (flightPhase === 'ground') {
        if (!checkWeather()) return;
        handleTakeOff();
        
        // Wait for takeoff to complete (roughly 3s for 25m at current speed) then start
        setTimeout(() => {
             executeMissionLogic();
        }, 3500); 
    } else {
        executeMissionLogic();
    }
  };

  const executeMissionLogic = async () => {
    setFlightPhase('scanning');
    setScanProgress(0);
    addLog("Starting Pollination & Health Scan...");

    // Simulate Scanning Progress
    let p = 0;
    scanInterval.current = setInterval(async () => {
        p += 2; // Slower scan
        setScanProgress(p);
        if (p === 10) addLog("Mapping Field Boundaries...");
        if (p === 30) addLog("Detecting Pollination Gaps...");
        if (p === 60) addLog("Identifying Pest Hotspots...");
        if (p === 85) addLog("Calculating Precision Spray Routes...");
        
        if (p >= 100) {
            clearInterval(scanInterval.current);
            finishMission();
        }
    }, 100);
  };

  const finishMission = async () => {
    setFlightPhase('analyzing');
    addLog("Scan Complete. Processing AI Diagnostics...");
    addLog("Generating Precision Interventions...");

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const prompt = `
            Simulate the AgriBee Phase-2 autonomous agricultural drone report.
            Context: AgriBee addresses declining pollination and crop health.
            Environment: Field ${envSettings.fieldSize}, Crop ${envSettings.crop}, ${envSettings.season}, Wind ${envSettings.wind}km/h, Temp ${envSettings.temperature}°C, Humidity ${envSettings.humidity}%.
            
            Generate a detailed analysis focusing on:
            1. POLLINATION: Estimate pollination success rate based on ${envSettings.season} and environmental conditions (e.g. humidity affects pollen). If low (<70%), suggest "AgriBee Drone Pollination" intervention for specific zones.
            2. PRECISION SPRAYING: Identify specific pest hotspots (zones) relevant to ${envSettings.crop}. Recommend spot-spraying chemicals/organics to reduce usage.
            3. CROP HEALTH: NDVI analysis for nutrient issues for ${envSettings.crop}.
            
            Return valid JSON:
            {
                "flightPlan": { "estimatedTime": "string", "batteryEstimate": "string", "coverageEfficiency": "string" },
                "diagnosis": { 
                    "pollinationSuccess": number (0-100), 
                    "pestDetection": "string summary", 
                    "detectedPests": [
                        { "name": "string", "location": "Zone A/B/C/D", "severity": "High/Medium/Low", "impact": "string" }
                    ],
                    "nutrientImbalance": "string" 
                },
                "zones": [
                   { "id": "A", "health": number, "pollination": number, "risk": "Low/Med/High", "explanation": "string", "needsSpray": boolean, "needsPollination": boolean },
                   { "id": "B", "health": number, "pollination": number, "risk": "Low/Med/High", "explanation": "string", "needsSpray": boolean, "needsPollination": boolean },
                   { "id": "C", "health": number, "pollination": number, "risk": "Low/Med/High", "explanation": "string", "needsSpray": boolean, "needsPollination": boolean },
                   { "id": "D", "health": number, "pollination": number, "risk": "Low/Med/High", "explanation": "string", "needsSpray": boolean, "needsPollination": boolean }
                ],
                "decisions": { 
                    "spraying": "string (Specific precision advice)", 
                    "intervention": "string (Pollination advice)", 
                    "safeToFly": boolean 
                },
                "report": { "farmerSimple": "string", "technicalExpert": "string" },
                "future": { "yieldForecast": "string", "riskProjection": "string" }
            }
            
            IMPORTANT: Return ONLY the JSON. Do not include any markdown code blocks or explanations.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
            config: { responseMimeType: "application/json" }
        });

        if (response.text) {
            const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(cleanText);
            setDroneData(data);
            setFlightPhase('report');
            addLog("AgriBee Mission Report Generated.");
        }
    } catch (e) {
        console.error("Drone Simulation Error", e);
        addLog("Error processing data.");
        setFlightPhase('hovering'); // Go back to hover if fail
    }
  };

  const handleZoneAction = (action: string, zoneId: string) => {
    setDeployingAction(action);
    setTimeout(() => {
      setDeployingAction(null);
      setActionSuccess(`Deployed: ${action} in Zone ${zoneId}`);
      
      // Update local data to reflect improvement
      if (droneData && selectedZone) {
        const updatedZones = droneData.zones.map(z => {
            if (z.id === zoneId) {
                return {
                    ...z,
                    risk: 'Low',
                    health: Math.min(100, z.health + 15), // Boost health
                    needsSpray: action === 'Spray' ? false : z.needsSpray,
                    needsPollination: action === 'Pollination' ? false : z.needsPollination
                }
            }
            return z;
        });
        const updatedData = { ...droneData, zones: updatedZones };
        setDroneData(updatedData);
        setSelectedZone(updatedZones.find((z: any) => z.id === zoneId)); // Update modal view
      }
      
      setTimeout(() => setActionSuccess(null), 3000);
    }, 2500);
  };

  // --- RENDER HELPERS ---

  const getStatusLabel = () => {
    switch(flightPhase) {
        case 'ground': return 'SYSTEM READY (GROUNDED)';
        case 'taking_off': return 'TAKING OFF';
        case 'hovering': return 'HOVERING / HOLD';
        case 'scanning': return 'SCANNING FIELD';
        case 'analyzing': return 'AI DIAGNOSIS';
        case 'returning': return 'RETURNING HOME';
        case 'landing': return 'LANDING SEQUENCE';
        case 'report': return 'MISSION COMPLETE';
        default: return 'UNKNOWN';
    }
  };

  const renderHeatmap = () => {
    if (!droneData) return null;
    return (
        <div className="relative w-full mx-auto bg-gray-800/50 rounded-2xl overflow-hidden border border-gray-600/50 shadow-2xl">
            {/* Map Grid Background */}
            <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
            }}></div>
            
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-center z-10 bg-gradient-to-b from-gray-900/80 to-transparent">
                <span className="text-xs font-mono text-green-400 flex items-center"><MapIcon size={12} className="mr-1"/> FIELD MAP: T-72</span>
                <div className="flex items-center space-x-2">
                   <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 rounded border border-red-500/30">ACTION REQ</span>
                </div>
            </div>

            {/* Interactive Zones */}
            <div className="grid grid-cols-2 gap-1 p-1 pt-10 aspect-square">
                {droneData.zones.map((zone) => (
                    <button 
                        key={zone.id} 
                        onClick={() => setSelectedZone(zone)}
                        className={`relative group transition-all duration-300 flex flex-col justify-between p-3 overflow-hidden
                            ${zone.risk === 'High' ? 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/30' :
                              zone.risk === 'Med' || zone.risk === 'Medium' ? 'bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30' :
                              'bg-green-500/10 hover:bg-green-500/20 border border-green-500/30'}
                        `}
                    >
                        <div className="flex justify-between items-start w-full">
                            <span className="text-xs font-bold font-mono opacity-70 text-white">ZONE {zone.id}</span>
                            {/* Status Dot */}
                            <div className={`w-2 h-2 rounded-full shadow-[0_0_5px_currentColor] ${
                                zone.risk === 'High' ? 'bg-red-500 animate-pulse' : 
                                zone.risk === 'Med' || zone.risk === 'Medium' ? 'bg-yellow-500' : 
                                'bg-green-500'
                            }`}></div>
                        </div>
                        
                        <div className="mt-2 text-center">
                           <div className="text-3xl font-bold text-white tracking-tighter">{zone.health}</div>
                           <div className="text-[9px] text-white/50 uppercase">Health Score</div>
                        </div>

                        <div className="flex items-center justify-center space-x-2 mt-3">
                             {zone.needsSpray && <Droplets size={14} className="text-red-400 drop-shadow-md" />}
                             {zone.needsPollination && <Wind size={14} className="text-yellow-400 drop-shadow-md" />}
                             {!zone.needsSpray && !zone.needsPollination && <Check size={14} className="text-green-400 opacity-50" />}
                        </div>

                        {/* Hover Effect Overlay */}
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                        <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Maximize2 size={12} className="text-white/70" />
                        </div>
                    </button>
                ))}
            </div>
            
            {/* Footer Coordinates */}
            <div className="bg-gray-900/80 p-2 flex justify-between items-center border-t border-gray-700">
                <span className="text-[9px] font-mono text-gray-500">LAT: 23.451 N</span>
                <span className="text-[9px] font-mono text-gray-500">LNG: 77.412 E</span>
            </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-poppins pb-48 overflow-x-hidden relative">
      
      {/* Overlay HUD - Scanlines */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-10" style={{
         backgroundImage: 'linear-gradient(transparent 50%, rgba(0,0,0,0.5) 50%)',
         backgroundSize: '100% 4px'
      }}></div>

      {/* Top HUD Bar - Enhanced Status & Battery */}
      <div className="relative z-30 bg-gray-900/90 backdrop-blur-md border-b border-white/10 pt-4 pb-4 px-5 rounded-b-[2rem] shadow-lg">
         <div className="flex justify-between items-center mb-4">
             <SideMenu onNavigate={onNavigate} currentPage={currentTab} whiteIcon={true} userName={userName} />
             <div className="flex-1 text-center mx-4">
                 <h1 className="text-sm font-bold text-gray-400 tracking-widest mb-1">AGRIBEE AUTONOMOUS SYSTEM</h1>
                 <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-mono font-bold border ${
                     flightPhase === 'ground' ? 'bg-green-900/30 border-green-500/50 text-green-400' : 
                     flightPhase === 'returning' || flightPhase === 'landing' ? 'bg-yellow-900/30 border-yellow-500/50 text-yellow-400' :
                     'bg-blue-900/30 border-blue-500/50 text-blue-400 animate-pulse'
                 }`}>
                     {flightPhase === 'ground' ? <CheckCircle size={12} className="mr-2" /> : <Activity size={12} className="mr-2 animate-spin" />}
                     {getStatusLabel()}
                 </div>
             </div>
             
             {/* Config Button */}
             <button onClick={() => setShowConfigModal(true)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10">
                 <Settings size={20} />
             </button>
         </div>

         {/* Telemetry Strip */}
         <div className="flex justify-between items-center px-2 text-xs font-mono text-gray-400">
            <div className="flex items-center space-x-4">
                <div className={`flex items-center ${batteryLevel < 20 ? 'text-red-500 animate-pulse' : 'text-green-400'}`}>
                    <Battery size={14} className="mr-1" /> {Math.round(batteryLevel)}%
                </div>
                <div className="flex items-center text-blue-400">
                    <Wifi size={14} className="mr-1" /> {Math.round(signalStrength)}%
                </div>
                <div className="flex items-center text-yellow-400">
                    <Radio size={14} className="mr-1" /> GPS: 18
                </div>
            </div>
            <div className="flex items-center space-x-4">
                <div className="flex items-center">
                    <ArrowUp size={14} className="mr-1" /> {altitude.toFixed(1)}m
                </div>
                <div className="flex items-center">
                    <Navigation size={14} className="mr-1" /> {horizontalSpeed.toFixed(1)}m/s
                </div>
            </div>
         </div>
      </div>

      {/* Main Viewport */}
      <div className="px-4 mt-4 relative z-10">
          
          {/* Live Feed / Map Area */}
          <div className="aspect-[4/3] bg-black rounded-3xl border-2 border-gray-700 overflow-hidden relative shadow-2xl group">
              
              {/* Background - Dynamic based on phase */}
              <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80)'}}></div>
              
              {/* Scanning Overlay */}
              {(flightPhase === 'scanning' || flightPhase === 'analyzing') && (
                  <div className="absolute inset-0 z-10">
                      <div className="w-full h-1 bg-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.8)] absolute top-0 animate-scan-laser"></div>
                      <div className="absolute inset-0 bg-green-500/10"></div>
                      
                      {/* Detection Boxes */}
                      <div className="absolute top-1/4 left-1/4 w-16 h-16 border-2 border-red-500/70 rounded animate-pulse">
                          <div className="absolute -top-4 left-0 bg-red-500 text-white text-[8px] px-1">PEST</div>
                      </div>
                      <div className="absolute bottom-1/3 right-1/4 w-20 h-20 border-2 border-yellow-500/70 rounded animate-pulse delay-500">
                           <div className="absolute -top-4 left-0 bg-yellow-500 text-white text-[8px] px-1">LOW POLLEN</div>
                      </div>
                  </div>
              )}

              {/* Center Crosshair */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
                  <Crosshair size={48} className="text-white" strokeWidth={1} />
              </div>

              {/* Corner Brackets */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white/50 rounded-tl-lg"></div>
              <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/50 rounded-tr-lg"></div>
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white/50 rounded-bl-lg"></div>
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-white/50 rounded-br-lg"></div>

              {/* Progress Bar (Mission) */}
              {(flightPhase === 'scanning' || flightPhase === 'analyzing') && (
                  <div className="absolute bottom-10 left-10 right-10">
                      <div className="flex justify-between text-xs font-bold text-white mb-1 shadow-black drop-shadow-md">
                          <span>MISSION PROGRESS</span>
                          <span>{scanProgress}%</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden border border-white/20">
                          <div className="h-full bg-green-500 transition-all duration-300" style={{width: `${scanProgress}%`}}></div>
                      </div>
                  </div>
              )}
          </div>

          {/* Flight Controls Deck */}
          <div className="mt-4 grid grid-cols-4 gap-3">
              <button 
                onClick={startAutonomousMission}
                disabled={flightPhase !== 'ground' && flightPhase !== 'hovering'}
                className={`col-span-2 py-4 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95 border ${
                    flightPhase === 'scanning' ? 'bg-green-900/20 border-green-500 text-green-400' :
                    'bg-gray-800 hover:bg-gray-700 border-gray-700 text-white'
                }`}
              >
                 <Play size={24} className={flightPhase === 'scanning' ? 'animate-pulse' : ''} />
                 <span className="text-[10px] font-bold mt-1 uppercase">Auto Mission</span>
              </button>

              <button 
                onClick={handleReturnToBase}
                className="py-4 bg-gray-800 hover:bg-gray-700 rounded-xl flex flex-col items-center justify-center border border-gray-700 active:scale-95"
              >
                 <Home size={24} className="text-yellow-400" />
                 <span className="text-[10px] font-bold mt-1 uppercase text-gray-300">RTH</span>
              </button>

              <button 
                onClick={flightPhase === 'ground' ? handleTakeOff : handleLand}
                className={`py-4 rounded-xl flex flex-col items-center justify-center border active:scale-95 transition-colors ${
                    flightPhase === 'ground' 
                    ? 'bg-green-600 hover:bg-green-700 border-green-500 text-white' 
                    : 'bg-red-600 hover:bg-red-700 border-red-500 text-white'
                }`}
              >
                 <Power size={24} />
                 <span className="text-[10px] font-bold mt-1 uppercase">{flightPhase === 'ground' ? 'Take Off' : 'Land'}</span>
              </button>
          </div>

          {/* Console Logs */}
          <div className="mt-4 bg-black/80 p-3 rounded-xl font-mono text-[10px] text-green-400 border border-green-900/30 h-32 overflow-hidden shadow-inner">
              {logs.length === 0 && <span className="text-gray-600 opacity-50">System Idle... Waiting for command.</span>}
              {logs.map((log, i) => (
                  <div key={i} className="mb-1 truncate animate-fade-in">
                      <span className="text-gray-500 mr-2">[{new Date().toLocaleTimeString().split(' ')[0]}]</span>
                      {log}
                  </div>
              ))}
          </div>
          
          {/* Mission Report Card - Appears when data is ready */}
          {droneData && (
             <div className="mt-6 bg-gray-800 rounded-3xl p-5 border border-gray-700 animate-slide-up mb-24">
                 <div className="flex justify-between items-start mb-4">
                     <div>
                         <h3 className="text-lg font-bold text-white">Mission Report</h3>
                         <p className="text-xs text-gray-400">AI Analysis Complete</p>
                     </div>
                     <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-bold border border-green-500/30">
                         Safe to Fly: {droneData.decisions.safeToFly ? 'YES' : 'NO'}
                     </div>
                 </div>

                 {/* AI Summary */}
                 <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/30 mb-6">
                     <h4 className="text-xs font-bold text-blue-300 uppercase mb-2 flex items-center"><Info size={14} className="mr-2" /> AgriBee AI Diagnosis</h4>
                     <p className="text-sm text-blue-100 leading-relaxed">{droneData.report.farmerSimple}</p>
                 </div>

                 {/* Stats Grid */}
                 <div className="grid grid-cols-2 gap-3 mb-6">
                     <div className="bg-gray-900 p-3 rounded-xl border border-gray-700 text-center">
                         <div className="text-2xl font-bold text-yellow-400">{droneData.diagnosis.pollinationSuccess}%</div>
                         <div className="text-[10px] text-gray-500 uppercase">Pollination Rate</div>
                     </div>
                     <div className="bg-gray-900 p-3 rounded-xl border border-gray-700 text-center">
                         <div className="text-2xl font-bold text-red-400">{droneData.diagnosis.detectedPests.length}</div>
                         <div className="text-[10px] text-gray-500 uppercase">Pest Hotspots</div>
                     </div>
                 </div>
                 
                 {/* Heatmap Visualization */}
                 <div className="mb-6">
                     <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Field Zone Health Map</h4>
                     {renderHeatmap()}
                 </div>
                 
                 {/* Ready for Takeoff Action Card */}
                 <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 p-5 rounded-2xl border border-green-500/30 relative overflow-hidden group">
                     <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                         <Zap size={80} />
                     </div>
                     
                     <div className="relative z-10">
                         <h3 className="font-bold text-xl text-white mb-1">Ready for Action?</h3>
                         <p className="text-xs text-gray-300 mb-4 max-w-[80%]">
                             AgriBee can autonomously deploy precision sprays and pollination drones based on this map.
                         </p>
                         <button 
                            onClick={() => addLog("Deploying corrective fleet...")}
                            className="bg-green-500 hover:bg-green-600 text-white text-sm font-bold py-2 px-6 rounded-xl shadow-lg shadow-green-900/50 transition-transform active:scale-95 flex items-center"
                         >
                             <Play size={16} className="mr-2" fill="currentColor" /> Launch Fleet
                         </button>
                     </div>
                 </div>
             </div>
          )}
      </div>

      {/* Configuration Modal */}
      {showConfigModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowConfigModal(false)} />
              <div className="bg-gray-800 w-full max-w-sm rounded-3xl shadow-2xl relative z-10 p-6 border border-gray-700 animate-scale-in">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-white text-lg">Simulation Config</h3>
                      <button onClick={() => setShowConfigModal(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
                  </div>
                  
                  <div className="space-y-4">
                      <div className="bg-gray-900 p-3 rounded-xl">
                          <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Weather Conditions</label>
                          <div className="grid grid-cols-2 gap-2">
                              <button onClick={randomizeWeather} className="bg-blue-600/20 text-blue-400 border border-blue-500/30 p-2 rounded-lg text-xs font-bold flex items-center justify-center hover:bg-blue-600/30">
                                  <Shuffle size={12} className="mr-1" /> Randomize
                              </button>
                              <button onClick={toggleStormMode} className={`border p-2 rounded-lg text-xs font-bold flex items-center justify-center ${envSettings.wind === '45' ? 'bg-red-600/20 text-red-400 border-red-500/30' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                                  <CloudLightning size={12} className="mr-1" /> Storm Mode
                              </button>
                          </div>
                          <div className="mt-3 flex justify-between text-xs text-gray-400">
                              <span>Wind: {envSettings.wind} km/h</span>
                              <span>Temp: {envSettings.temperature}°C</span>
                          </div>
                      </div>

                      <div className="bg-gray-900 p-3 rounded-xl">
                          <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Crop Details</label>
                          <input 
                             className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-green-500 mb-2"
                             value={envSettings.crop}
                             onChange={(e) => setEnvSettings({...envSettings, crop: e.target.value})}
                          />
                          <select 
                             className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-green-500"
                             value={envSettings.season}
                             onChange={(e) => setEnvSettings({...envSettings, season: e.target.value})}
                          >
                              <option>Early Stage</option>
                              <option>Mid-flowering</option>
                              <option>Harvest Ready</option>
                          </select>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Zone Detail Modal */}
      {selectedZone && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedZone(null)} />
              <div className="bg-gray-800 w-full max-w-sm rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl relative z-10 border border-gray-700 animate-slide-up overflow-hidden">
                  {/* Header */}
                  <div className={`p-6 ${
                      selectedZone.risk === 'High' ? 'bg-red-900/30' : 
                      selectedZone.risk === 'Med' ? 'bg-yellow-900/30' : 
                      'bg-green-900/30'
                  }`}>
                      <div className="flex justify-between items-start">
                          <div>
                              <h2 className="text-2xl font-bold text-white">Zone {selectedZone.id}</h2>
                              <div className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-1 ${
                                  selectedZone.risk === 'High' ? 'bg-red-500 text-white' : 
                                  selectedZone.risk === 'Med' ? 'bg-yellow-500 text-black' : 
                                  'bg-green-500 text-white'
                              }`}>
                                  Risk Level: {selectedZone.risk}
                              </div>
                          </div>
                          <button onClick={() => setSelectedZone(null)} className="bg-black/20 p-2 rounded-full hover:bg-black/40 text-white">
                              <X size={20} />
                          </button>
                      </div>
                  </div>

                  <div className="p-6 space-y-6">
                      <div className="bg-gray-900 p-4 rounded-2xl border border-gray-700">
                          <p className="text-gray-300 text-sm leading-relaxed">
                              {selectedZone.explanation}
                          </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="bg-black/30 p-3 rounded-xl text-center">
                              <div className="text-xl font-bold text-white">{selectedZone.health}</div>
                              <div className="text-[10px] text-gray-500 uppercase">Health Index</div>
                          </div>
                          <div className="bg-black/30 p-3 rounded-xl text-center">
                              <div className="text-xl font-bold text-white">{selectedZone.pollination}%</div>
                              <div className="text-[10px] text-gray-500 uppercase">Pollination</div>
                          </div>
                      </div>

                      <div className="space-y-3">
                          <h4 className="text-xs font-bold text-gray-500 uppercase">Recommended Actions</h4>
                          
                          {selectedZone.needsSpray && (
                              <button 
                                  onClick={() => handleZoneAction('Spray', selectedZone.id)}
                                  disabled={deployingAction !== null}
                                  className="w-full flex items-center justify-between p-4 bg-red-500/10 border border-red-500/50 rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-50"
                              >
                                  <div className="flex items-center text-red-400">
                                      <Bug size={18} className="mr-3" />
                                      <div className="text-left">
                                          <div className="font-bold text-sm">Deploy Precision Spray</div>
                                          <div className="text-[10px] opacity-70">Target: Pest Hotspots</div>
                                      </div>
                                  </div>
                                  <ChevronRight size={16} className="text-red-400" />
                              </button>
                          )}

                          {selectedZone.needsPollination && (
                              <button 
                                  onClick={() => handleZoneAction('Pollination', selectedZone.id)}
                                  disabled={deployingAction !== null}
                                  className="w-full flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-xl hover:bg-yellow-500/20 transition-colors disabled:opacity-50"
                              >
                                  <div className="flex items-center text-yellow-400">
                                      <Wind size={18} className="mr-3" />
                                      <div className="text-left">
                                          <div className="font-bold text-sm">Deploy Pollinator Drone</div>
                                          <div className="text-[10px] opacity-70">Target: Low Yield Areas</div>
                                      </div>
                                  </div>
                                  <ChevronRight size={16} className="text-yellow-400" />
                              </button>
                          )}

                          {!selectedZone.needsSpray && !selectedZone.needsPollination && (
                              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center justify-center text-green-400">
                                  <CheckCircle size={18} className="mr-2" /> Zone is Healthy
                              </div>
                          )}
                      </div>
                  </div>

                  {/* Success Toast Overlay in Modal */}
                  {actionSuccess && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
                          <div className="text-center">
                              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                  <Check size={32} className="text-white" />
                              </div>
                              <h3 className="text-xl font-bold text-white">Action Successful</h3>
                              <p className="text-green-400 text-sm mt-1">{actionSuccess}</p>
                          </div>
                      </div>
                  )}
                  
                  {/* Loading Overlay */}
                  {deployingAction && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
                          <div className="text-center">
                              <Radio size={48} className="text-blue-500 animate-ping mx-auto mb-4" />
                              <h3 className="text-lg font-bold text-white">Deploying...</h3>
                              <p className="text-blue-400 text-sm mt-1">Sending commands to fleet</p>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* WEATHER WARNING MODAL */}
      {weatherAlert && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-fade-in">
              <div className="bg-red-900/20 border-2 border-red-500 p-8 rounded-3xl max-w-xs text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>
                  <div className="relative z-10">
                      <ShieldAlert size={64} className="text-red-500 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-white mb-2">FLIGHT HAZARD</h2>
                      <p className="text-red-200 text-sm mb-6">
                          Wind speeds exceed safety limits ({envSettings.wind} km/h). Autonomous flight prevented to avoid drone loss.
                      </p>
                      <button 
                          onClick={() => setWeatherAlert(false)}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl w-full transition-transform active:scale-95"
                      >
                          ACKNOWLEDGE
                      </button>
                  </div>
              </div>
          </div>
      )}

      <AIChatBot />
      
      {/* CSS Animation Styles */}
      <style>{`
        @keyframes scan-laser {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
        .animate-scan-laser {
            animation: scan-laser 2s linear infinite;
        }
        /* Custom Chevron for buttons used inside */
        .chevron-right {
            width: 24px;
            height: 24px;
        }
      `}</style>
    </div>
  );
};

// Helper Component for Chevron
function ChevronRight({ size, className }: { size?: number, className?: string }) {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width={size || 24} 
            height={size || 24} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
    )
}
