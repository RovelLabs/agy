import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

describe('OPERON Multi-Platform Native Artifacts & Deployments', () => {
  const rootDir = process.cwd();

  test('Windows packaging & host scripts must be complete and valid', async () => {
    const trayHost = path.join(rootDir, 'apps', 'desktop', 'src', 'windows', 'tray_host.js');
    const winTray = path.join(rootDir, 'apps', 'desktop', 'src', 'windows', 'win_tray.ps1');
    const installerZip = path.join(rootDir, 'OPERON-Windows-Installer-v1.0.0.zip');

    assert.ok(await fs.stat(trayHost));
    assert.ok(await fs.stat(winTray));
    assert.ok(await fs.stat(installerZip));

    const ps1Content = await fs.readFile(winTray, 'utf8');
    assert.ok(ps1Content.includes('System.Windows.Forms.NotifyIcon'));
    assert.ok(ps1Content.includes('Open Quick HUD'));
    assert.ok(ps1Content.includes('Recipe Library'));

    const zipStat = await fs.stat(installerZip);
    assert.ok(zipStat.size > 20000, `Installer zip should be > 20KB, got ${zipStat.size}`);
  });

  test('macOS Application bundle structure & Info.plist must be valid', async () => {
    const plistPath = path.join(rootDir, 'apps', 'macos', 'Operon.app', 'Contents', 'Info.plist');
    const launcherPath = path.join(rootDir, 'apps', 'macos', 'Operon.app', 'Contents', 'MacOS', 'operon');
    const macosTar = path.join(rootDir, 'OPERON-macOS-Universal-v1.0.0.tar.gz');

    assert.ok(await fs.stat(plistPath));
    assert.ok(await fs.stat(launcherPath));
    assert.ok(await fs.stat(macosTar));

    const plist = await fs.readFile(plistPath, 'utf8');
    assert.ok(plist.includes('<key>LSUIElement</key>'));
    assert.ok(plist.includes('<string>run.operon.desktop</string>'));
    assert.ok(plist.includes('NSServices'));
    assert.ok(plist.includes('<string>operon</string>'));

    const tarStat = await fs.stat(macosTar);
    assert.ok(tarStat.size > 20000, `macOS tar.gz should be > 20KB, got ${tarStat.size}`);
  });

  test('Android project manifest, activities, and gradle configs must be complete', async () => {
    const manifestPath = path.join(rootDir, 'apps', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
    const mainActivityPath = path.join(rootDir, 'apps', 'android', 'app', 'src', 'main', 'java', 'run', 'operon', 'mobile', 'MainActivity.kt');
    const shareActivityPath = path.join(rootDir, 'apps', 'android', 'app', 'src', 'main', 'java', 'run', 'operon', 'mobile', 'ShareActivity.kt');
    const gradlePath = path.join(rootDir, 'apps', 'android', 'app', 'build.gradle.kts');

    assert.ok(await fs.stat(manifestPath));
    assert.ok(await fs.stat(mainActivityPath));
    assert.ok(await fs.stat(shareActivityPath));
    assert.ok(await fs.stat(gradlePath));

    const manifest = await fs.readFile(manifestPath, 'utf8');
    assert.ok(manifest.includes('android.intent.action.SEND'));
    assert.ok(manifest.includes('android.intent.action.VIEW'));
    assert.ok(manifest.includes('android.service.quicksettings.action.QS_TILE'));
    assert.ok(manifest.includes('run.operon.mobile'));

    const kt = await fs.readFile(mainActivityPath, 'utf8');
    assert.ok(kt.includes('class MainActivity'));
    assert.ok(kt.includes('OperonAndroidBridge'));
    assert.ok(kt.includes('readClipboard'));
  });

  test('iOS project structure, AppIntents, and ShareExtension must be complete', async () => {
    const plistPath = path.join(rootDir, 'apps', 'ios', 'OperonApp', 'Info.plist');
    const appPath = path.join(rootDir, 'apps', 'ios', 'OperonApp', 'OperonApp.swift');
    const viewPath = path.join(rootDir, 'apps', 'ios', 'OperonApp', 'ContentView.swift');
    const intentPath = path.join(rootDir, 'apps', 'ios', 'OperonApp', 'Intents', 'OperonIntents.swift');
    const sharePath = path.join(rootDir, 'apps', 'ios', 'ShareExtension', 'ShareViewController.swift');

    assert.ok(await fs.stat(plistPath));
    assert.ok(await fs.stat(appPath));
    assert.ok(await fs.stat(viewPath));
    assert.ok(await fs.stat(intentPath));
    assert.ok(await fs.stat(sharePath));

    const intentCode = await fs.readFile(intentPath, 'utf8');
    assert.ok(intentCode.includes('CleanClipboardIntent: AppIntent'));
    assert.ok(intentCode.includes('OperonShortcutsProvider: AppShortcutsProvider'));

    const shareCode = await fs.readFile(sharePath, 'utf8');
    assert.ok(shareCode.includes('ShareViewController: UIViewController'));
    assert.ok(shareCode.includes('processSharedItems'));
  });
});
