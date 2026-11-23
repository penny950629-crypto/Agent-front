import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import LeftPanel from './LeftPanel';
import Leftmiddle from './Leftmiddle';
import Leftcorner from './Leftcorner';
import MiddlePanel from './MiddlePanel';
import RightPanel from './RightPanel';
import { demoPredictionPatients } from '../services/predictionApi';

interface DashboardPatient {
  patient_id: string;
  triage_id?: string;
  status: string;
  final_level: number;
  risk_score: number;
  alert_message?: string;
  [key: string]: unknown;
}

export default function Dashboard() {
  const [patients, setPatients] = useState<DashboardPatient[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<DashboardPatient | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('未處理');
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('http://localhost:8000/api/patients')
      .then(response => response.json())
      .then(data => {
        if (Array.isArray(data)) {
          const normalizedData = (data as unknown[])
            .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
            .map((item): DashboardPatient => ({
              ...item,
              patient_id: String(item.patient_id ?? ''),
              status: typeof item.status === 'string' ? item.status : '未處理',
              final_level: Number(item.final_level) || 0,
              risk_score: Number(item.risk_score) || 0,
              triage_id: item.triage_id === undefined ? undefined : String(item.triage_id),
            }));
          setPatients(normalizedData);
          setError(null);
        } else {
          const apiMessage = typeof data === 'object' && data !== null && 'error' in data ? data.error : null;
          setError(typeof apiMessage === 'string' ? apiMessage : '無法讀取資料');
        }
      })
      .catch(err => {
        console.error(err);
        setPatients(demoPredictionPatients.map((patient) => ({
          patient_id: patient.medicalRecordNo ?? String(patient.prediction_id),
          patient_name: patient.patient_name,
          triage_id: String(patient.prediction_id),
          final_level: patient.triage_degree,
          risk_score: patient.serious_risk_pct,
          status: '未處理',
          sentiment: patient.complaint ?? '',
          temperature: patient.t,
          heart_rate: patient.hr,
          respiratory_rate: patient.rr,
          sbp: patient.sbp,
          dbp: patient.dbp,
          spo2: patient.spo2,
          age: patient.age,
          gender: patient.gender,
          admission_distribution: patient.admit_distribution,
        })));
        setError('後端 API 無法連線，畫面改用去識別化示範資料；風險分數非臨床建議。');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setSelectedLevel(null);
  };

  const observationAlerts = patients.filter(p => p.status === '觀察中' && p.alert_message);

  const filteredPatients = patients.filter(p => {
    const matchStatus = p.status === statusFilter;
    const matchLevel = selectedLevel ? Number(p.final_level) === selectedLevel : true;
    return matchStatus && matchLevel;
  });

  const patientsForStats = patients.filter(p => p.status === statusFilter);

  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden', backgroundColor: '#F8FAFC' }}>

      {/* 儀表板主畫面 */}
      <div style={{
        display: 'flex', 
        padding: '24px',
        boxSizing: 'border-box',
        opacity: isLoading ? 0.5 : 1,
        filter: isLoading ? 'blur(3px)' : 'none',
        pointerEvents: isLoading ? 'none' : 'auto',
        transition: 'opacity 0.4s ease-in-out',
        height: '100%', 
        overflow: 'hidden'
      }}>

        {/* ==================== 左側欄位組合 ==================== */}
        <div style={{
          width: selectedPatient ? '0px' : '320px',
          marginRight: selectedPatient ? '0px' : '24px',
          opacity: selectedPatient ? 0 : 1,
          overflow: 'hidden',
          flexShrink: 0,
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          height: '100%'
        }}>
          <div style={{ 
            width: '320px', 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            boxSizing: 'border-box'
          }}>
            <LeftPanel
              patients={patients}
              statusFilter={statusFilter}
              setStatusFilter={handleStatusChange}
              error={error}
              alertCount={observationAlerts.length}
            />
            <Leftmiddle
              patients={patients}
              onSelectPatient={(patientId) => {
                const found = patients.find(p => p.patient_id === patientId);
                if (found) setSelectedPatient(found);
              }}
            />
            <Leftcorner
              patients={patientsForStats}
              selectedLevel={selectedLevel}
              onSelectLevel={setSelectedLevel}
            />
          </div>
        </div>

        {/* ==================== 中間病患清單 ==================== */}
        <div style={{
          flex: selectedPatient ? '0 0 350px' : '1 1 0%',
          marginRight: selectedPatient ? '24px' : '0px',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <MiddlePanel
            patients={filteredPatients}
            error={error}
            selectedPatient={selectedPatient}
            onSelectPatient={setSelectedPatient}
          />
        </div>

        {/* ==================== 右側 AI 決策 ==================== */}
        <div style={{
          flex: selectedPatient ? '1 1 0%' : '0 0 0px',
          opacity: selectedPatient ? 1 : 0,
          overflow: 'hidden',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          minWidth: 0,
          height: '100%'
        }}>
          <div style={{ minWidth: '500px', height: '100%' }}>
            {selectedPatient && (
              <RightPanel 
                patient={selectedPatient} 
                onClose={() => setSelectedPatient(null)} 
              />
            )}
          </div>
        </div>

      </div>

      {/* 載入中遮罩 */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(248, 250, 252, 0.4)',
          zIndex: 50,
          gap: '24px'
        }}>
          <div style={{
            position: 'relative', width: '80px', height: '80px',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            backgroundColor: 'white', borderRadius: '50%',
            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.15)',
          }}>
            <div style={{
              position: 'absolute', width: '100%', height: '100%', borderRadius: '50%',
              backgroundColor: '#3B82F6', animation: 'pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite', opacity: 0.2
            }} />
            <Activity color="#3B82F6" size={36} style={{ animation: 'pulse-icon 2s ease-in-out infinite' }} />
          </div>

          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#1E293B', fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>
              載入急診即時數據
            </p>
            <p style={{ color: '#64748B', fontSize: '14px', margin: 0, animation: 'fade-text 2s infinite' }}>
              正在連線至資料庫，請稍候...
            </p>
          </div>

          <style>
            {`
              @keyframes pulse-ring {
                0% { transform: scale(0.8); opacity: 0.6; }
                100% { transform: scale(2.2); opacity: 0; }
              }
              @keyframes pulse-icon {
                0% { transform: scale(1); }
                50% { transform: scale(1.15); }
                100% { transform: scale(1); }
              }
              @keyframes fade-text {
                0% { opacity: 0.4; }
                50% { opacity: 1; }
                100% { opacity: 0.4; }
              }
            `}
          </style>
        </div>
      )}

    </div>
  );
}