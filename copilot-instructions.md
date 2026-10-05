# ED-DSS Project Instructions
- Context: AI-assisted Emergency Department Triage & Deterioration Risk Prediction System.
- Stack: React (Frontend), Python (FASTAPI), MySQL, Scikit-learn (Random Forest, KNN), XGBoost.
- Security (CRITICAL): NEVER use or generate real patient data (PHI). Use mock data only. Never commit `.env`.
- Architecture: Frontend (React) is for UI/state. AI inference and database queries MUST be isolated in the Python backend.
- Naming: Use accurate medical terms (e.g., `triageLevel`, `vitalSigns`); strictly use camelCase.
- Localization: All UI text and comments MUST be Traditional Chinese (zh-TW) with Taiwan medical phrasing.
- Glossary: Enforce 檢傷分類 (not 分診), 生命徵象 (not 體徵), 病歷號 (not 門診號), 急診室 (not 急診科).