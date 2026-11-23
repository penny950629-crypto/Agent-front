import { useMemo, useState } from 'react';

// 1. 建立假資料
const mockRecords = [
  {
    id: 1,
    time: '2026/07/28 14:20',
    visitNo: 'DEMO-VISIT-001',
    name: '示範病患 A (男, 45)',
    recordNo: 'DEMO-HIST-001',
    complaint: '胸口劇烈壓迫感伴隨冷汗',
    triageLevel: '第 2 級 - 危急',
    triageRule: '[A0301] 中度呼吸徵象異常或 SpO2 92-94% [N0402] 急性中度頭痛伴隨發燒 (Temp > 38.5°C)',
    triageColor: '#C2410C', 
    triageBg: '#FFEDD5',    
    triageBorder: '#FDBA74',
    nurse: '示範護理師',
    riskPercent: 68,
    aiPrediction: '加護病房 72%',
    vitals: { temp: '38.8', hr: '108', spo2: '94', rr: '22', bp: '135/85', bs: '110', gcs: 'E4V5M6', pain: '6' }
  },
  {
    id: 2,
    time: '2026/07/28 13:10',
    visitNo: 'DEMO-VISIT-002',
    name: '示範病患 B (女, 62)',
    recordNo: 'DEMO-HIST-002',
    complaint: '跌倒左手關節腫脹變形',
    triageLevel: '第 3 級 - 緊急',
    triageRule: '[A0401] 輕度呼吸徵象異常 [N0501] 肢體疑似骨折',
    triageColor: '#B45309', 
    triageBg: '#FEF3C7',
    triageBorder: '#FCD34D',
    nurse: '示範護理師',
    riskPercent: 24,
    aiPrediction: '一般病房 56%',
    vitals: { temp: '36.5', hr: '88', spo2: '98', rr: '18', bp: '120/80', bs: '95', gcs: 'E4V5M6', pain: '4' }
  },
];

type HistoryRecord = (typeof mockRecords)[number];

export default function Records({ isDarkMode }: { isDarkMode?: boolean }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<HistoryRecord | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [criticalOnly, setCriticalOnly] = useState(false);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredRecords = useMemo(() => mockRecords.filter((record) => {
    const recordDate = record.time.slice(0, 10).replaceAll('/', '-');
    const matchesSearch = !normalizedSearch ||
      `${record.name} ${record.recordNo} ${record.visitNo}`.toLowerCase().includes(normalizedSearch);
    const matchesStart = !startDate || recordDate >= startDate;
    const matchesEnd = !endDate || recordDate <= endDate;
    const matchesCritical = !criticalOnly || record.triageLevel.startsWith('第 1') || record.triageLevel.startsWith('第 2');
    return matchesSearch && matchesStart && matchesEnd && matchesCritical;
  }), [normalizedSearch, startDate, endDate, criticalOnly]);

  const handleOpenModal = (patient: HistoryRecord, mode: 'view' | 'edit') => {
    setSelectedPatient(patient);
    setModalMode(mode);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPatient(null);
  };


  return (
    <div style={{ padding: '24px', color: isDarkMode ? 'white' : '#333', position: 'relative', height: '100%' }}>
      
      {/* 頂部標題與搜尋區塊 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <span style={{ color: '#2563EB' }}></span> 急診檢傷歷史病歷紀錄
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: '8px' }}>
          <input 
            type="text"
            placeholder="搜尋病患姓名或病歷號..."
            aria-label="搜尋病患姓名或病歷號"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', width: '220px', outline: 'none', fontSize: '14px' }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>起始日期<input aria-label="起始日期" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>結束日期<input aria-label="結束日期" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <input type="checkbox" checked={criticalOnly} onChange={(event) => setCriticalOnly(event.target.checked)} />
            僅看第 1–2 級
          </label>
        </div>
      </div>

      {/* 病歷表格 */}
      <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: isDarkMode ? '#1E293B' : 'white' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #E5E7EB', textAlign: 'left', backgroundColor: isDarkMode ? '#334155' : '#F9FAFB' }}>
              <th style={{ padding: '14px 16px', fontWeight: '600', color: '#6B7280' }}>時間</th>
              <th style={{ padding: '14px 16px', fontWeight: '600', color: '#6B7280' }}>就診號</th>
              <th style={{ padding: '14px 16px', fontWeight: '600', color: '#6B7280' }}>姓名</th>
              <th style={{ padding: '14px 16px', fontWeight: '600', color: '#6B7280' }}>病歷號</th>
              <th style={{ padding: '14px 16px', fontWeight: '600', color: '#6B7280' }}>主訴</th>
              <th style={{ padding: '14px 16px', fontWeight: '600', color: '#6B7280' }}>檢傷等級</th>
              <th style={{ padding: '14px 16px', fontWeight: '600', color: '#6B7280' }}>檢傷護理師</th>
              <th style={{ padding: '14px 16px', fontWeight: '600', color: '#6B7280' }}>AI 預測／風險</th>
              <th style={{ padding: '14px 16px', fontWeight: '600', color: '#6B7280' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length ? filteredRecords.map((record) => (
              <tr key={record.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '14px 16px' }}>{record.time.split(' ')[1]}</td>
                <td style={{ padding: '14px 16px', color: '#2563EB' }}>{record.visitNo}</td>
                <td style={{ padding: '14px 16px', fontWeight: 'bold' }}>{record.name}</td>
                <td style={{ padding: '14px 16px' }}>{record.recordNo}</td>
                <td style={{ padding: '14px 16px' }}>{record.complaint}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ backgroundColor: record.triageBg, color: record.triageColor, padding: '6px 10px', borderRadius: '20px', fontSize: '0.85em', fontWeight: 'bold' }}>
                    {record.triageLevel.split('-')[0]}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>{record.nurse}</td>
                <td style={{ padding: '14px 16px' }}>{record.riskPercent}%（3 小時）<div style={{ fontSize: '12px', color: '#64748B' }}>{record.aiPrediction}</div></td>
                <td style={{ padding: '14px 16px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                  <span style={{ color: '#2563EB', cursor: 'pointer', marginRight: '12px' }} onClick={() => handleOpenModal(record, 'view')}>檢視</span>
                  <span style={{ color: '#059669', cursor: 'pointer' }} onClick={() => handleOpenModal(record, 'edit')}>載入修改</span>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={9} style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>此日期區間沒有符合的急診病歷紀錄</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 彈出視窗 (Modal) */}
      {isModalOpen && selectedPatient && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          
          <div style={{ 
            backgroundColor: 'white', width: '900px', maxHeight: '90vh', overflowY: 'auto', 
            borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', color: '#333' 
          }}>
            
            {/* Modal 頂部深色標題列 */}
            <div style={{ backgroundColor: '#1E293B', color: 'white', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📄 天主教輔仁大學附設醫院 Nursing Assessment Record
              </h3>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {/* 修改點 1：只有檢視模式才顯示下載與列印按鈕 */}
                {modalMode === 'view' && (
                  <>
                    <button style={{ backgroundColor: '#3B82F6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                       下載 Word 檔
                    </button>
                    <button style={{ backgroundColor: '#10B981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      🖨️ 列印病歷
                    </button>
                  </>
                )}
                <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '20px', cursor: 'pointer', marginLeft: '8px' }}>✖</button>
              </div>
            </div>

            {/* Modal 內容區 */}
            <div style={{ padding: '32px 48px' }}>
              
              {/* 醫院表頭 */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', letterSpacing: '2px', color: '#111827' }}>天主教輔仁大學附設醫院</h2>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#1F2937' }}>急診護理評估與檢傷紀錄單</h3>
                <p style={{ margin: 0, color: '#6B7280', fontSize: '13px', fontFamily: 'serif' }}>Nursing Assessment & Triage Record</p>
              </div>

              {/* 病患基本資料表 */}
              <div style={{ borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB', padding: '16px 0', marginBottom: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px 24px', fontSize: '14px' }}>
                <div><strong>姓名:</strong> {selectedPatient.name.split(' ')[0]}</div>
                <div><strong>病歷號:</strong> {selectedPatient.recordNo}</div>
                <div><strong>就診號:</strong> {selectedPatient.visitNo}</div>
                <div><strong>性別/年齡:</strong> {selectedPatient.name.split(' ')[1].replace(/[()]/g, '')}</div>
                <div><strong>看診時間:</strong> {selectedPatient.time}</div>
                <div><strong>來源:</strong> 急診</div>
                <div><strong>大傷事件:</strong> 無</div>
              </div>

              {/* 一、病患主訴 */}
              <h4 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '15px' }}>一、病患主訴 (Chief Complaint)</h4>
              <div style={{ marginBottom: '24px' }}>
                {modalMode === 'edit' ? (
                  <textarea 
                    defaultValue={selectedPatient.complaint}
                    style={{ width: '100%', border: '1px solid #CBD5E1', padding: '12px', borderRadius: '4px', minHeight: '60px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', outlineColor: '#3B82F6', boxSizing: 'border-box' }}
                  />
                ) : (
                  <div style={{ border: '1px solid #E5E7EB', padding: '12px', borderRadius: '4px', fontSize: '14px', minHeight: '44px' }}>
                    {selectedPatient.complaint}
                  </div>
                )}
              </div>

              {/* 二、生命徵象 */}
              <h4 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '15px' }}>二、生命徵象 (Vital Signs)</h4>
              <div style={{ border: '1px solid #E5E7EB', padding: '16px', borderRadius: '4px', marginBottom: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                {Object.entries({
                  '體溫 (°C)': selectedPatient.vitals.temp,
                  '脈搏 (次/分)': selectedPatient.vitals.hr,
                  '血氧 SpO2 (%)': selectedPatient.vitals.spo2,
                  '呼吸 (次/分)': selectedPatient.vitals.rr,
                  '血壓 (mmHg)': selectedPatient.vitals.bp,
                  '血糖 (mg/dL)': selectedPatient.vitals.bs,
                  'GCS': selectedPatient.vitals.gcs,
                  '疼痛指數 (分)': selectedPatient.vitals.pain
                }).map(([label, value]) => {
                  const cleanLabel = label.split(' ')[0]; 
                  const unit = label.split(' ')[1] || '';
                  
                  return (
                    <div key={label} style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <strong style={{ color: '#374151' }}>{cleanLabel}:</strong>
                      {modalMode === 'edit' ? (
                        <input type="text" defaultValue={value} style={{ width: '60px', padding: '2px 4px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '14px' }} />
                      ) : (
                        <span>{value}</span>
                      )}
                      <span style={{ color: '#6B7280', fontSize: '13px' }}>{unit}</span>
                    </div>
                  )
                })}
              </div>

              {/* 三、檢傷分級判定 */}
              <h4 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '15px' }}>三、TTAS 檢傷分級判定</h4>
              <div style={{ backgroundColor: selectedPatient.triageBg, border: `1px solid ${selectedPatient.triageBorder}`, padding: '16px', borderRadius: '4px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 8px 0', color: selectedPatient.triageColor, fontSize: '16px' }}>判定等級：{selectedPatient.triageLevel}</h3>
                  <p style={{ margin: 0, fontSize: '13px', color: selectedPatient.triageColor, opacity: 0.9 }}>
                    匹配規則：{selectedPatient.triageRule}
                  </p>
                </div>
                <div style={{ textAlign: 'right', fontSize: '12px', color: selectedPatient.triageColor, marginLeft: '16px' }}>
                  <div>檢傷護理師：{selectedPatient.nurse}</div>
                  <div>簽章日期：{selectedPatient.time.split(' ')[0]}</div>
                </div>
              </div>

              {/* 修改點 2：底部按鈕區 - 根據模式改變佈局 */}
              <div style={{ 
                display: 'flex', 
                justifyContent: modalMode === 'edit' ? 'flex-end' : 'space-between', 
                alignItems: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #E5E7EB' 
              }}>
                {/* 只有檢視模式才顯示派案選單 */}
                {modalMode === 'view' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>派案診別/醫師:</label>
                    <select style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #D1D5DB', fontSize: '14px', outline: 'none', width: '220px' }}>
                      <option>急診內科 - 張醫師 (第一診)</option>
                      <option>急診外科 - 李醫師 (第二診)</option>
                    </select>
                  </div>
                )}
                
                <button 
                  onClick={modalMode === 'edit' ? handleCloseModal : undefined} 
                  style={{ backgroundColor: '#059669', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {modalMode === 'edit' ? '💾 儲存修改內容' : '確定傳送給醫師'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}