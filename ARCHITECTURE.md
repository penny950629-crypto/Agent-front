# AI 輔助急診決策系統 (ED-DSS) 系統架構與工程規範

## 1. 核心技術棧
* **前端框架 (UI/UX)：** React, Vite, TypeScript, Tailwind CSS (負責呈現急診戰情看板、病患列表與動態互動)
* **後端邏輯與 API：** Python (FastAPI) (接收前端請求、資料驗證與資料庫溝通)
* **AI 決策引擎：** Random Forest (隨機森林)、KNN (K-近鄰演算法)、XGBoost (病情惡化與檢傷預測)
* **資料庫與雲端服務：** Supabase (儲存去識別化病歷、生命徵象與系統資料)[cite: 3, 4]

---

## 2. 目錄結構與職責分工 (前後端與模組化架構)

├── Agent-front/             # React 前端專案
│   ├── src/
│   │   ├── components/      # 共用 UI 元件 (如：檢傷級別標籤、風險警告彈窗)
│   │   ├── pages/           # 核心頁面 (如：急診戰情看板 Dashboard、病患詳細資料頁)
│   │   ├── services/        # 集中管理呼叫後端 FastAPI 的 API
│   │   └── utils/           # 前端工具 (如：時間格式化、顏色判定)
│
├── agent-back/              # Python FastAPI 後端與 API 專案
│   ├── api/                 # API 路由定義 (接收前端請求)
│   ├── ai_engine/           # AI 模型運算區
│   │   ├── models/          # 存放訓練好的模型權重檔 (.pkl 或 .joblib)
│   │   └── predictors/      # 執行 RF, KNN, XGBoost 推論的程式碼
│   ├── database/            # Supabase 資料庫連線與資料操作
│   └── config.py            # 系統設定 (讀取環境變數)
│
├── Agent-model/             # AI 模型訓練、實驗與資料處理腳本
│
└── .env                     # 環境變數檔 (存放 Supabase 金鑰與密鑰，嚴禁上傳 GitHub)

---

## 3. 架構核心原則

1. **前後端嚴格分離 (Separation of Concerns)：** 
   - `Agent-front/` (React) 只負責畫面渲染與狀態管理，嚴禁在前端寫入複雜的 AI 運算或直接連線資料庫。
   - 所有的資料與 AI 預測結果，必須透過呼叫 `agent-back/` 的 API 來取得。
2. **AI 模型封裝：** 
   - Random Forest, KNN, XGBoost 模型的預測邏輯 (Inference) 必須統一放在 `agent-back/ai_engine/`，後端收到病患的生命徵象後，呼叫模型算出「惡化風險機率」，再把數字回傳給前端顯示。
3. **醫療資料安全：** 
   - 系統內嚴禁存放明碼的病患身分證字號或真實姓名。測試環境一律使用 Mock (假) 資料[cite: 4]。

---

## 4. 醫療在地化與繁體中文用語規範
為符合台灣醫療機構習慣，全站介面與程式碼註解請嚴格遵守以下對照表[cite: 4]：

| 台灣醫院習慣用語 (必須使用) | 禁止使用之用語 (避免出現) |
| :--- | :--- |
| **檢傷分類**[cite: 4] | 分診 / 預檢[cite: 4] |
| **生命徵象 (心跳、血壓等)**[cite: 4] | 生命體徵 / 體徵[cite: 4] |
| **病歷 / 病歷號**[cite: 4] | 病歷本 / 門診號[cite: 4] |
| **急診室 / 急診部**[cite: 4] | 急診科[cite: 4] |
| **惡化風險預測**[cite: 4] | 惡報 / 惡化預測[cite: 4] |
| **醫護人員 / 使用者**[cite: 4] | 醫護用戶 / 操作員[cite: 4] |