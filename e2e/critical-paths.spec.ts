import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes } from './fixtures/mockBase44';

// Small, high-value regression coverage for paths not exercised by the
// existing suite: primary navigation, the donation/support page (real donor
// funds — see SECURITY.md), and the auth boundary on a protected route.
// Deliberately kept to 3 tests, not a sweep — see ENGINEERING_SUMMARY.md's
// testing-gap note for what's still not covered (login form submission,
// Map's own search/filter interactions, backend function unit tests).

function trackConsoleErrors(page: import('@playwright/test').Page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

test('primary navigation: home -> map -> report all render without crashing', async ({ page }) => {
  const consoleErrors = trackConsoleErrors(page);
  await mockBase44(page, { user: null, locations: {}, locationPhotos: [] });

  await page.goto('/');
  await expect(page).toHaveTitle(/OOH/i);

  await page.getByRole('link', { name: 'Field map', exact: true }).click();
  await expect(page).toHaveURL(/\/map/);
  await expect(page.locator('#root')).not.toBeEmpty();

  await page.goto('/report');
  await expect(page.getByRole('heading', { name: /Log an/i })).toBeVisible();

  expect(filterCrashes(consoleErrors), consoleErrors.join('\n')).toEqual([]);
});

test('donation/support page renders the Donorbox embed', async ({ page }) => {
  const consoleErrors = trackConsoleErrors(page);
  await page.goto('/support');

  const iframe = page.locator('iframe[title="OOH Earth donations"]');
  await expect(iframe).toBeVisible();
  await expect(iframe).toHaveAttribute('src', /donorbox\.org\/embed\/ooh-donations/);

  expect(filterCrashes(consoleErrors), consoleErrors.join('\n')).toEqual([]);
});

test('auth boundary: an unauthenticated visitor hitting /dashboard is redirected to /login, not shown the queue', async ({
  page,
}) => {
  const consoleErrors = trackConsoleErrors(page);
  // No ?access_token= — appParams.token stays empty, so AuthContext never
  // calls auth.me() and isAuthenticated stays false (see AuthContext.jsx).
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByText(/Log in/i).first()).toBeVisible();

  expect(filterCrashes(consoleErrors), consoleErrors.join('\n')).toEqual([]);
});
