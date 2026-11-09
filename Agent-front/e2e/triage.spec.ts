import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('http://127.0.0.1:8000/api/predictions', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
  await page.route('http://localhost:8000/api/patients', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
});

test('首頁會顯示當前候診名單', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: '急診臨床決策輔助系統' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '當前候診名單' })).toBeVisible();
});

test('急診戰情看板會顯示病患風險排序清單', async ({ page }) => {
  await page.goto('/triage');

  await expect(page.getByRole('heading', { name: '病患風險排序清單' })).toBeVisible();
});
