import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('http://127.0.0.1:8000/api/predictions', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
  await page.route('http://localhost:8000/api/patients', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
});

async function signIn(page: Page, username = 'D1001') {
  await page.goto('/');
  await page.getByPlaceholder('請輸入帳號').fill(username);
  await page.getByPlaceholder('請輸入密碼').fill('demo123');
  await page.getByRole('button', { name: '登入' }).click();
}

test('首頁會顯示當前候診名單', async ({ page }) => {
  await signIn(page);

  await expect(page.getByRole('heading', { name: '急診臨床決策輔助系統' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '當前候診名單' })).toBeVisible();
});

test('急診戰情看板會顯示病患風險排序清單', async ({ page }) => {
  await signIn(page);
  await page.goto('/triage');

  await expect(page.getByRole('heading', { name: '病患風險排序清單' })).toBeVisible();
});

test('管理員登入後可開啟醫師帳號管理', async ({ page }) => {
  await signIn(page, 'admin');

  await expect(page.getByRole('heading', { name: '醫師管理系統' })).toBeVisible();
});

test('停用的醫師帳號無法登入', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('fjcu-demo-staff', JSON.stringify([
      { id: 'D1001', name: '示範醫師', status: '停用' },
    ]));
  });
  await signIn(page);

  await expect(page.getByRole('alert')).toHaveText('帳號或密碼錯誤，或此帳號已停用。');
});

test('病歷可依病歷號與日期區間篩選', async ({ page }) => {
  await signIn(page);
  await page.goto('/records');

  const firstRecord = page.getByRole('row').filter({ hasText: 'DEMO-HIST-001' });
  const secondRecord = page.getByRole('row').filter({ hasText: 'DEMO-HIST-002' });
  await expect(firstRecord).toBeVisible();
  await expect(secondRecord).toBeVisible();

  await page.getByRole('textbox', { name: '搜尋病患姓名或病歷號' }).fill('DEMO-HIST-001');
  await expect(firstRecord).toBeVisible();
  await expect(secondRecord).toHaveCount(0);

  await page.getByRole('textbox', { name: '搜尋病患姓名或病歷號' }).fill('');
  await page.getByLabel('起始日期').fill('2026-07-29');
  await page.getByLabel('結束日期').fill('2026-07-30');
  await expect(page.getByText('此日期區間沒有符合的急診處置紀錄')).toBeVisible();
});

test('醫師可保存 AI 回饋並編輯歷程處置紀錄', async ({ page }) => {
  await page.route('http://127.0.0.1:8000/api/predictions', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{
        prediction_id: 9101,
        excel_row_id: 1,
        patient_name: '示範病患 A',
        triage_degree: 2,
        serious_risk_pct: 78,
        admit_distribution: { ICU: 0.72, Ward: 0.21, Discharge: 0.07 },
        medicalRecordNo: 'DEMO-CASE-01',
        gender: '女',
        age: 64,
        complaint: '胸悶與呼吸急促',
        t: 37.2,
        hr: 118,
        rr: 26,
        sbp: 92,
        dbp: 61,
        spo2: 91,
      }]),
    }),
  );
  await signIn(page);
  await expect(page.getByRole('button', { name: '進入看診' })).toBeVisible();
  await page.getByRole('button', { name: '進入看診' }).click();
  await expect(page.getByRole('heading', { name: '示範病患 A' })).toBeVisible();

  await page.getByRole('button', { name: '1. 完全採納建議' }).click();
  await page.getByLabel('實際轉歸').selectOption('一般病房');
  await page.getByLabel(/醫生文字回饋/).fill('示範回饋');
  await page.getByRole('button', { name: '確認送出' }).click();

  const feedbackRow = page.getByRole('row').filter({ hasText: 'DEMO-CASE-01' });
  await expect(feedbackRow).toContainText('完全採納');
  await expect(feedbackRow).toContainText('一般病房');

  await page.getByRole('button', { name: '編輯紀錄' }).click();
  await page.getByRole('textbox', { name: '編輯處置紀錄' }).fill('修訂後的示範處置說明');
  await page.getByRole('textbox', { name: '編輯已執行處置' }).fill('生命徵象監測');
  await page.getByRole('button', { name: '儲存', exact: true }).click();
  await expect(page.getByText('修訂後的示範處置說明')).toBeVisible();
  await expect(page.getByText('生命徵象監測')).toBeVisible();
});
