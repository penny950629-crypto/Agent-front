import { useEffect, useState } from 'react';
import { fetchPredictionPatients, type PredictionPatient } from '../services/predictionApi';

interface PredictionsProps {
  isDarkMode?: boolean;
}

export default function Predictions({ isDarkMode = false }: PredictionsProps) {
  const [predictions, setPredictions] = useState<PredictionPatient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [demoNotice, setDemoNotice] = useState('');

  useEffect(() => {
    let active = true;
    fetchPredictionPatients().then(({ patients, isDemoData, message }) => {
      if (!active) return;
      setPredictions(patients);
      setDemoNotice(isDemoData ? message : '');
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const cardBg = isDarkMode ? '#1E293B' : '#FFFFFF';
  const textColor = isDarkMode ? '#F8FAFC' : '#0F172A';
  const borderColor = isDarkMode ? '#334155' : '#E2E8F0';

  return (
    <div style={{ padding: '24px', color: textColor, transition: 'color 0.3s' }}>
      <h2 style={{ marginBottom: '20px' }}>AI 檢傷與重症風險預測結果</h2>
      {demoNotice && <p role="status" style={{ padding: '10px 12px', color: '#92400E', backgroundColor: '#FEF3C7', borderRadius: '8px' }}>{demoNotice}</p>}

      {loading ? (
        <p>載入預測數據中...</p>
      ) : (
        <div style={{ backgroundColor: cardBg, borderRadius: '8px', border: `1px solid ${borderColor}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: isDarkMode ? '#0F172A' : '#F1F5F9', borderBottom: `1px solid ${borderColor}` }}>
                <th style={{ padding: '12px 16px' }}>Excel 行號</th>
                <th style={{ padding: '12px 16px' }}>病患姓名</th>
                <th style={{ padding: '12px 16px' }}>AI 檢傷級別</th>
                <th style={{ padding: '12px 16px' }}>重症風險機率 (%)</th>
                <th style={{ padding: '12px 16px' }}>預測處置動向分佈</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((item) => (
                <tr key={item.prediction_id} style={{ borderBottom: `1px solid ${borderColor}` }}>
                  <td style={{ padding: '12px 16px' }}>{item.excel_row_id}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '500' }}>{item.patient_name}</td>
                  <td style={{ padding: '12px 16px' }}>第 {item.triage_degree} 級</td>
                  <td
                    style={{
                      padding: '12px 16px',
                      color: item.serious_risk_pct > 10 ? '#EF4444' : '#10B981',
                      fontWeight: 'bold',
                    }}
                  >
                    {item.serious_risk_pct}%
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {item.admit_distribution &&
                      Object.entries(typeof item.admit_distribution === 'string' ? JSON.parse(item.admit_distribution) as Record<string, string> : item.admit_distribution)
                        .map(([key, val]) => `${key}: ${val}`)
                        .join(' | ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}