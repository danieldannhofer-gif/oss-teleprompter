import { test, expect } from '@playwright/test';

test.describe('Teleprompter E2E', () => {
  test('app loads and shows title', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('Teleprompter');
  });

  test('shows empty state when no script loaded', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=No script loaded')).toBeVisible();
  });

  test('paste text and load script shows lines', async ({ page }) => {
    await page.goto('/');

    // Open import dialog
    await page.click('button:has-text("Import Script")');
    await expect(page.locator('h2:has-text("Import Script")')).toBeVisible();

    // Paste text
    await page.fill('textarea', 'Welcome to the presentation\nToday we discuss results\nThank you all');

    // Load script
    await page.click('button:has-text("Load Script")');

    // Verify lines appear
    await expect(page.locator('text=Welcome to the presentation')).toBeVisible();
    await expect(page.locator('text=Today we discuss results')).toBeVisible();
    await expect(page.locator('text=Thank you all')).toBeVisible();

    // Empty state should be gone
    await expect(page.locator('text=No script loaded')).not.toBeVisible();
  });

  test('play/pause button toggles', async ({ page }) => {
    await page.goto('/');

    // Load a script first
    await page.click('button:has-text("Import Script")');
    await page.fill('textarea', 'Line one\nLine two\nLine three');
    await page.click('button:has-text("Load Script")');

    // Initially paused — button shows "Play"
    const playButton = page.locator('button:has-text("Play")');
    await expect(playButton).toBeVisible();

    // Click play
    await playButton.click();

    // Button should now show "Pause"
    await expect(page.locator('button:has-text("Pause")')).toBeVisible();

    // Click pause
    await page.click('button:has-text("Pause")');

    // Button should show "Play" again
    await expect(page.locator('button:has-text("Play")')).toBeVisible();
  });

  test('space key toggles play/pause', async ({ page }) => {
    await page.goto('/');

    // Load a script
    await page.click('button:has-text("Import Script")');
    await page.fill('textarea', 'Test line');
    await page.click('button:has-text("Load Script")');

    // Press space to play
    await page.keyboard.press('Space');
    await expect(page.locator('button:has-text("Pause")')).toBeVisible();

    // Press space to pause
    await page.keyboard.press('Space');
    await expect(page.locator('button:has-text("Play")')).toBeVisible();
  });

  test('language toggle switches EN to DE', async ({ page }) => {
    await page.goto('/');

    // Initially EN — button shows "EN"
    const langButton = page.locator('button:has-text("EN")');
    await expect(langButton).toBeVisible();

    // Click to switch to DE
    await langButton.click();

    // Button should now show "DE"
    await expect(page.locator('button:has-text("DE")')).toBeVisible();

    // Import button text should be in German
    await expect(page.locator('button:has-text("Skript importieren")')).toBeVisible();

    // Switch back to EN
    await page.click('button:has-text("DE")');
    await expect(page.locator('button:has-text("Import Script")')).toBeVisible();
  });

  test('settings panel opens and closes', async ({ page }) => {
    await page.goto('/');

    // Click settings
    await page.click('button:has-text("Settings")');

    // Settings panel should be visible with overlay settings
    await expect(page.locator('text=Overlay Settings')).toBeVisible();
    await expect(page.locator('text=Transparent Overlay Mode')).toBeVisible();

    // Click hide
    await page.click('button:has-text("Hide")');

    // Settings panel should be gone
    await expect(page.locator('text=Overlay Settings')).not.toBeVisible();
  });

  test('cancel closes import dialog', async ({ page }) => {
    await page.goto('/');

    // Open import dialog
    await page.click('button:has-text("Import Script")');
    await expect(page.locator('h2:has-text("Import Script")')).toBeVisible();

    // Click cancel
    await page.click('button:has-text("Cancel")');

    // Dialog should be closed
    await expect(page.locator('h2:has-text("Import Script")')).not.toBeVisible();
  });

  test('import markdown file via file input', async ({ page }) => {
    await page.goto('/');

    // Open import dialog
    await page.click('button:has-text("Import Script")');

    // Upload the test fixture
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./public/fixtures/test-script.md');

    // Dialog should close automatically after import
    await expect(page.locator('h2:has-text("Import Script")')).not.toBeVisible();

    // Lines from the markdown should appear
    await expect(page.locator('text=Welcome to the teleprompter test presentation.')).toBeVisible();
    await expect(page.locator('text=The quick brown fox jumps over the lazy dog.')).toBeVisible();
  });

  test('import DOCX file via file input', async ({ page }) => {
    await page.goto('/');

    // Open import dialog
    await page.click('button:has-text("Import Script")');

    // Upload the DOCX fixture
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./public/fixtures/sample.docx');

    // Dialog should close automatically after import
    await expect(page.locator('h2:has-text("Import Script")')).not.toBeVisible();

    // Lines from the DOCX should appear
    await expect(page.locator('text=Welcome to the teleprompter test document.')).toBeVisible();
    await expect(page.locator('text=The quick brown fox jumps over the lazy dog.')).toBeVisible();
  });

  test('voice tracking button is disabled without script', async ({ page }) => {
    await page.goto('/');

    // Voice tracking button should be disabled
    const voiceButton = page.locator('button:has-text("Start Voice Tracking")');
    await expect(voiceButton).toBeDisabled();
  });

  test('voice tracking button is enabled with script', async ({ page }) => {
    await page.goto('/');

    // Load a script
    await page.click('button:has-text("Import Script")');
    await page.fill('textarea', 'Test line');
    await page.click('button:has-text("Load Script")');

    // Voice tracking button should be enabled
    const voiceButton = page.locator('button:has-text("Start Voice Tracking")');
    await expect(voiceButton).toBeEnabled();
  });

  test('keyboard shortcut hint is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Space: Play/Pause')).toBeVisible();
  });
});
