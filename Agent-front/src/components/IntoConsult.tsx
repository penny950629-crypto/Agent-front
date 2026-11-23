import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Bot, BrainCircuit } from 'lucide-react';
import { fetchPredictionPatients, getPredictedDisposition } from '../services/predictionApi';

interface XaiFactor {
  name: string;
  impact: number;
  type: 'pos' | 'neg';
}

interface ConsultPatient {
  id: string;
  name: string;
  gender: string;
  age: number;
  level: number;
  summary: string;
  vitals: Record<string, string | number>;
  aiRiskScore: number;
  aiDisposition: string;
  ensembleVotes: { RF: boolean; XGB: boolean; KNN: boolean };
  xaiFactors: XaiFactor[];
}

const generateXai = (
  complaint: string,
  level: number,
  riskScore: number,
  spo2?: number,
  temperature?: number,
) => {
  const text = (complaint || '').toLowerCase();
  const p1 = Math.max(Number((riskScore * 0.55).toFixed(1)), 0.5);
  const p2 = Math.max(Number((riskScore * 0.30).toFixed(1)), 0.3);
  const p3 = Math.max(Number((riskScore * 0.15).toFixed(1)), 0.1);
  let factors: XaiFactor[] = [
    { name: '主訴症狀與特徵匹配度', impact: p1, type: 'pos' },
    { name: '生理生命徵象數值偏移', impact: p2, type: 'pos' },
    { name: '年齡與基礎共病風險權重', impact: p3, type: 'pos' },
  ];

  if (text.includes('胸痛') || text.includes('胸悶')) {
    factors = [
      { name: '主訴特徵：胸痛相關症狀匹配', impact: p1, type: 'pos' },
      { name: `血氧與生命徵象異常 (SpO2=${spo2 || 95})`, impact: p2, type: 'pos' },
      { name: '心血管系統風險共病史', impact: p3, type: 'pos' },
    ];
  } else if (text.includes('呼吸') || text.includes('喘')) {
    factors = [
      { name: '呼吸速率與血氧窘迫指標', impact: p1, type: 'pos' },
      { name: '呼吸系統主訴文字特徵', impact: p2, type: 'pos' },
      { name: '年齡血行動力學權重', impact: p3, type: 'pos' },
    ];
  } else if (text.includes('發燒') || text.includes('畏寒') || text.includes('肺炎')) {
    factors = [
      { name: `體溫與感染指標異常 (T=${temperature || 38.5})`, impact: p1, type: 'pos' },
      { name: '感染相關主訴詞彙萃取', impact: p2, type: 'pos' },
      { name: '心跳速率代償性加快', impact: p3, type: 'pos' },
    ];
  } else if (text.includes('腹痛') || text.includes('腹瀉') || text.includes('嘔吐')) {
    factors = [
      { name: '急性腹部疼痛分級特徵', impact: p1, type: 'pos' },
      { name: '腸胃系統主訴文字權重', impact: p2, type: 'pos' },
      { name: '脫水與血壓代償指標', impact: p3, type: 'pos' },
    ];
  } else if (level === 1 || level === 2) {
    factors = [
      { name: '檢傷級別極高危險群警示', impact: p1, type: 'pos' },
      { name: '生理生命徵象嚴重不穩定', impact: p2, type: 'pos' },
      { name: '多重器官衰竭風險模型預測', impact: p3, type: 'pos' },
    ];
  }
  return factors;
};

export default function IntoConsult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<ConsultPatient | null>(null);
  const [demoNotice, setDemoNotice] = useState('');

  useEffect(() => {
    let active = true;
    fetchPredictionPatients().then(({ patients: data, isDemoData, message }) => {
      if (!active) return;
      setDemoNotice(isDemoData ? message : '');
      const found = data.find((item, index) => {
        const generatedId = item.medicalRecordNo || `00${8877665 + index}J`;
        return String(item.prediction_id) === id || generatedId === id;
      });
      if (found) {
        const risk = Number(found.serious_risk_pct) || 0;
        const level = Number(found.triage_degree) || 0;
        setPatient({
          id: found.medicalRecordNo || String(found.prediction_id),
          name: found.patient_name || '示範病患',
          gender: found.gender || '未提供',
          age: Number(found.age) || 0,
          level,
          summary: found.complaint || '無特殊主訴紀錄',
          vitals: {
            temperature: found.t ?? '--',
            heartRate: found.hr ?? '--',
            respiratoryRate: found.rr ?? '--',
            systolicBloodPressure: found.sbp ?? '--',
            diastolicBloodPressure: found.dbp ?? '--',
            spo2: found.spo2 ?? '--',
          },
          aiRiskScore: risk,
          aiDisposition: getPredictedDisposition(found.admit_distribution),
          ensembleVotes: {
            RF: risk > 20,
            XGB: risk > 30,
            KNN: risk > 40,
          },
          xaiFactors: generateXai(found.complaint || '', level, risk, Number(found.spo2), Number(found.t)),
        });
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>載入診間資料中...</div>;
  if (!patient) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <div style={{ marginBottom: 16, color: '#EF4444', fontWeight: 'bold' }}>找不到該名病患資料 (ID: {id})</div>
        <button type="button" onClick={() => navigate(-1)} style={{ padding: '8px 16px', color: 'white', backgroundColor: '#3B82F6', border: 'none', borderRadius: 6 }}>返回候診名單</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#F8FAFC', fontFamily: 'sans-serif' }}>
      {demoNotice && <div role="status" style={{ padding: '8px 24px', color: '#92400E', backgroundColor: '#FEF3C7', fontSize: 13 }}>{demoNotice}</div>}
      <div role="note" style={{ padding: '8px 24px', color: '#7F1D1D', backgroundColor: '#FEE2E2', fontSize: 13 }}>
        風險及解釋內容為原型示意，未經臨床驗證，不可作為診斷或治療依據。
      </div>
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #E2E8F0', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button type="button" onClick={() => navigate(-1)} style={{ padding: 6, border: 'none', borderRadius: 6, backgroundColor: '#F1F5F9', cursor: 'pointer' }} title="返回名單">
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ margin: 0, fontSize: 20, color: '#0F172A' }}>{patient.name}</h1>
        <span style={{ color: '#64748B' }}>{patient.gender}, {patient.age} 歲</span>
        <span style={{ color: '#94A3B8', fontFamily: 'monospace' }}>{patient.id}</span>
        <span style={{ backgroundColor: '#F1F5F9', color: '#475569', padding: '4px 10px', borderRadius: 4, fontSize: 13 }}>檢傷 {patient.level} 級</span>
      </div>
      <div style={{ padding: '24px 32px', flex: 1, overflow: 'auto', display: 'grid', gridTemplateColumns: 'minmax(420px, 1fr) minmax(420px, 1fr)', gap: 24 }}>
        <div style={{ backgroundColor: '#1E1B4B', borderRadius: 12, padding: 20, color: 'white', alignSelf: 'start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontWeight: 'bold' }}><Bot size={18} /> AI 惡化預測</div>
          <div style={{ fontSize: 12, color: '#A5B4FC', marginBottom: 6 }}>3 小時內嚴重惡化機率</div>
          <div style={{ fontSize: 32, fontWeight: 900 }}>{patient.aiRiskScore}%</div>
          <div style={{ marginTop: 16, fontSize: 12, color: '#A5B4FC' }}>系統預測病患轉歸動向</div>
          <div style={{ marginTop: 6, backgroundColor: '#4338CA', borderRadius: 8, padding: 10, textAlign: 'center', fontWeight: 'bold' }}>{patient.aiDisposition}</div>
        </div>
        <div style={{ backgroundColor: '#FEFCE8', borderRadius: 12, padding: 20, border: '1px solid #FEF08A', alignSelf: 'start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontWeight: 'bold', color: '#854D0E' }}><BrainCircuit size={18} /> AI 判斷核心依據 (XAI)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {patient.xaiFactors.map((factor, index) => (
              <div key={index} style={{ padding: 12, borderRadius: 10, border: '1px solid #FECDD3', backgroundColor: '#FFF1F2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#1E293B', fontWeight: 'bold' }}>{factor.name}</span>
                  <span style={{ color: '#BE123C', fontWeight: 900 }}>+{factor.impact}%</span>
                </div>
                <div style={{ backgroundColor: 'white', height: 10, borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ backgroundColor: '#F43F5E', height: '100%', width: `${Math.min(factor.impact * 2.5, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
