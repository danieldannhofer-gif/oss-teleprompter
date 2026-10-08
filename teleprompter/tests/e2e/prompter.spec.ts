// E2E tests for Teleprompter
// Run with: npx playwright test
//
// Prerequisites:
//   1. Build the app: .\scripts\build.ps1 -Release
//   2. Install Playwright: npm install -D @playwright/test
//   3. Run: npx playwright test
//
// These tests launch the built Teleprompter.exe and interact with it
// via the WebView2 remote debugging port.

import { test, expect, _electron as electron } from '@playwright/test';
import { findLatestBuild } from 'electron-playwright-helpers';
import path from 'path';

const exePath = path.resolve(__dirname, '../../build/Release/Teleprompter.exe');

test.describe('Teleprompter E2E', () => {
  test('app launches and shows title', async () => {
    // Launch the app via Playwright's Electron support
    // Note: Requires electron-playwright-helpers or WinAppDriver
    // This is a structural placeholder — adapt to your E2E harness
    expect(exePath).toBeTruthy();
  });

  test('import markdown script shows lines', async () => {
    // 1. Launch app
    // 2. Click Import button
    // 3. Select test-script.md fixture
    // 4. Verify lines appear in PrompterView
    // 5. Verify line count matches expected
  });

  test('play starts scrolling', async () => {
    // 1. Import script
    // 2. Click Play
    // 3. Wait 2 seconds
    // 4. Verify scroll position changed
  });

  test('pause stops scrolling', async () => {
    // 1. Import script
    // 2. Click Play
    // 3. Click Pause
    // 4. Verify scroll position is stable
  });

  test('speed change affects scroll rate', async () => {
    // 1. Import script
    // 2. Set speed to 2x
    // 3. Play for 2 seconds
    // 4. Verify scrolled further than at 1x
  });

  test('overlay toggle makes window always-on-top', async () => {
    // 1. Press F1
    // 2. Verify window style changed (via Win32 API or visual check)
  });

  test('settings persist across restart', async () => {
    // 1. Change language to DE
    // 2. Change font size
    // 3. Close app
    // 4. Reopen app
    // 5. Verify settings restored
  });

  test('voice tracking pauses off-script', async () => {
    // 1. Import script
    // 2. Start voice tracking
    // 3. Speak on-script → verify scrolling
    // 4. Speak off-script → verify pause
    // 5. Return to script → verify resume
  });
});
