export interface PredictionPatient {
  prediction_id: number;
  excel_row_id: number;
  patient_name: string;
  triage_degree: number;
  serious_risk_pct: number;
  admit_distribution?: Record<string, number | string> | string;
  arrivalTime?: string;
  medicalRecordNo?: string;
  gender?: string;
  age?: number;
  complaint?: string;
  area?: string;
  t?: number | string;
  hr?: number | string;
  rr?: number | string;
  sbp?: number | string;
  dbp?: number | string;
  spo2?: number | string;
  vitals?: {
    t: number;
    hr: number;
    rr: number;
    sbp: number;
    dbp: number;
    spo2: number;
  };
}

export interface PredictionResponse {
  patients: PredictionPatient[];
  isDemoData: boolean;
  message: string;
}

export const demoPredictionPatients: PredictionPatient[] = [
  {
    prediction_id: 9101,
    excel_row_id: 1,
    patient_name: '示範病患 A',
    triage_degree: 2,
    serious_risk_pct: 78,
    admit_distribution: { ICU: '0.72', Ward: '0.21', Discharge: '0.07' },
    arrivalTime: '08:12',
    medicalRecordNo: 'DEMO-0001',
    gender: '女',
    age: 64,
    complaint: '胸悶與呼吸急促',
    area: '急救重症區',
    t: 37.2,
    hr: 118,
    rr: 26,
    sbp: 92,
    dbp: 61,
    spo2: 91,
  },
  {
    prediction_id: 9102,
    excel_row_id: 2,
    patient_name: '示範病患 B',
    triage_degree: 3,
    serious_risk_pct: 42,
    admit_distribution: { ICU: '0.18', Ward: '0.56', Discharge: '0.26' },
    arrivalTime: '08:24',
    medicalRecordNo: 'DEMO-0002',
    gender: '男',
    age: 38,
    complaint: '發燒與咳嗽',
    area: '內科診間',
    t: 38.6,
    hr: 104,
    rr: 21,
    sbp: 118,
    dbp: 76,
    spo2: 95,
  },
  {
    prediction_id: 9103,
    excel_row_id: 3,
    patient_name: '示範病患 C',
    triage_degree: 4,
    serious_risk_pct: 16,
    admit_distribution: { ICU: '0.03', Ward: '0.12', Discharge: '0.85' },
    arrivalTime: '08:37',
    medicalRecordNo: 'DEMO-0003',
    gender: '女',
    age: 27,
    complaint: '手腕扭傷',
    area: '外科診間',
    t: 36.8,
    hr: 82,
    rr: 16,
    sbp: 122,
    dbp: 79,
    spo2: 98,
  },
  {
    prediction_id: 9104,
    excel_row_id: 4,
    patient_name: '示範病患 D',
    triage_degree: 2,
    serious_risk_pct: 63,
    admit_distribution: { ICU: '0.41', Ward: '0.47', Discharge: '0.12' },
    arrivalTime: '08:51',
    medicalRecordNo: 'DEMO-0004',
    gender: '男',
    age: 71,
    complaint: '腹痛伴隨嘔吐',
    area: '留觀區',
    t: 37.9,
    hr: 112,
    rr: 23,
    sbp: 101,
    dbp: 68,
    spo2: 96,
  },
];

export function getPredictedDisposition(distribution?: PredictionPatient['admit_distribution']): string {
  if (!distribution) return '未提供';
  let values: Record<string, number | string>;
  if (typeof distribution === 'string') {
    try {
      const parsed: unknown = JSON.parse(distribution);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('預測轉歸資料格式錯誤');
      }
      values = parsed as Record<string, number | string>;
    } catch (error) {
      console.error('解析預測轉歸失敗:', error);
      return '資料格式錯誤';
    }
  } else {
    values = distribution;
  }

  const top = Object.entries(values)
    .map(([name, value]) => [name, Number.parseFloat(String(value).replace('%', ''))] as const)
    .filter(([, value]) => Number.isFinite(value))
    .sort((left, right) => right[1] - left[1])[0];
  if (!top) return '未提供';
  const label = top[0] === 'ICU' ? '加護病房' : top[0] === 'Ward' ? '一般病房' : top[0] === 'Discharge' ? '急診留觀／出院' : top[0];
  const percent = top[1] <= 1 ? top[1] * 100 : top[1];
  return `${label} ${percent.toFixed(0)}%`;
}

export async function fetchPredictionPatients(): Promise<PredictionResponse> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
  try {
    const response = await fetch(`${apiBaseUrl}/api/predictions`);
    if (!response.ok) throw new Error(`API 回應狀態 ${response.status}`);
    const data: unknown = await response.json();
    if (!Array.isArray(data)) throw new Error('病患預測資料格式錯誤');
    return {
      patients: data as PredictionPatient[],
      isDemoData: false,
      message: '',
    };
  } catch (error) {
    console.error('讀取病患預測 API 失敗，改用去識別化示範資料:', error);
    return {
      patients: demoPredictionPatients,
      isDemoData: true,
      message: '目前使用去識別化示範資料；風險分數僅供介面展示，非臨床建議。',
    };
  }
}
