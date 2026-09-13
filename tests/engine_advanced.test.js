import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  WorkflowEngine,
  defaultActionRegistry,
  coreRecipes,
  Capabilities,
  ExecutionStatus
} from '../packages/core/src/index.js';

describe('OPERON Advanced Engine, New Actions, and 30 Core Recipes', () => {
  const testDir = path.join(process.cwd(), '.test_sandbox_advanced');

  before(async () => {
    await fs.mkdir(testDir, { recursive: true });
  });

  after(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {}
  });

  test('All 30 core recipes must be defined with valid schemas and actions', () => {
    assert.equal(coreRecipes.length, 30, `Expected 30 curated core recipes, found ${coreRecipes.length}`);

    for (const recipe of coreRecipes) {
      assert.ok(recipe.id, 'Recipe missing id');
      assert.ok(recipe.name, `Recipe ${recipe.id} missing name`);
      assert.ok(recipe.category, `Recipe ${recipe.id} missing category`);
      assert.ok(Array.isArray(recipe.steps), `Recipe ${recipe.id} missing steps array`);
      assert.ok(recipe.steps.length > 0, `Recipe ${recipe.id} has empty steps`);

      for (const step of recipe.steps) {
        assert.ok(step.actionId, `Step in ${recipe.id} missing actionId`);
        assert.ok(defaultActionRegistry.has(step.actionId), `Action ${step.actionId} in recipe ${recipe.id} not found in registry`);
      }
    }
  });

  test('text.strip_formatting should strip HTML, Markdown, and entities to plain text', async () => {
    const stripAction = defaultActionRegistry.get('text.strip_formatting');
    const dirty = '<h1>Hello <b>World</b></h1><p>Check <a href="https://example.com">this link</a> &amp; `code`!</p>';
    const res = await stripAction.execute({ text: dirty });

    assert.ok(!res.plainText.includes('<h1>'));
    assert.ok(!res.plainText.includes('<b>'));
    assert.ok(!res.plainText.includes('href'));
    assert.ok(res.plainText.includes('Hello World'));
    assert.ok(res.plainText.includes('this link & code!'));
  });

  test('text.word_count should accurately compute text metrics', async () => {
    const wcAction = defaultActionRegistry.get('text.word_count');
    const text = 'Operon is an autonomous operating layer. It runs completely offline. Privacy is paramount!';
    const res = await wcAction.execute({ text });

    assert.equal(res.words, 13);
    assert.equal(res.sentences, 3);
    assert.ok(res.characters > 50);
    assert.ok(res.readingMinutes >= 0);
  });

  test('text.slugify should format titles into URL slugs', async () => {
    const slugAction = defaultActionRegistry.get('text.slugify');
    const title = '  Operon: Release v1.0 & Architecture Deep-Dive!  ';
    const res = await slugAction.execute({ text: title });

    assert.equal(res.slug, 'operon-release-v10-architecture-deep-dive');
  });

  test('file.organize_directory and file.compress_zip should sort files and create valid ZIP', async () => {
    const organizeDir = path.join(testDir, 'organize_test');
    await fs.mkdir(organizeDir, { recursive: true });

    // Create dummy files of different types
    await fs.writeFile(path.join(organizeDir, 'photo.png'), Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]));
    await fs.writeFile(path.join(organizeDir, 'document.pdf'), 'dummy pdf content');
    await fs.writeFile(path.join(organizeDir, 'script.js'), 'console.log("hello");');

    const organizeAction = defaultActionRegistry.get('file.organize_directory');
    const orgRes = await organizeAction.execute({ directory: organizeDir, strategy: 'category', dryRun: false });

    assert.equal(orgRes.totalMoved, 3);
    assert.ok(await fs.stat(path.join(organizeDir, 'Images', 'photo.png')));
    assert.ok(await fs.stat(path.join(organizeDir, 'Documents', 'document.pdf')));
    assert.ok(await fs.stat(path.join(organizeDir, 'Code', 'script.js')));

    // Test ZIP creation
    const zipPath = path.join(testDir, 'bundle.zip');
    const zipAction = defaultActionRegistry.get('file.compress_zip');
    const zipRes = await zipAction.execute({
      files: [
        path.join(organizeDir, 'Documents', 'document.pdf'),
        path.join(organizeDir, 'Code', 'script.js')
      ],
      outputPath: zipPath
    });

    assert.equal(zipRes.filesPacked, 2);
    assert.ok(await fs.stat(zipPath));

    // Verify ZIP magic header 0x04034B50
    const zipBuf = await fs.readFile(zipPath);
    assert.equal(zipBuf.readUInt32LE(0), 0x04034B50);
  });

  test('image.get_dimensions should parse PNG dimensions accurately', async () => {
    // Generate valid 32x16 minimal PNG header
    const pngHeader = Buffer.alloc(24);
    pngHeader.set([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], 0);
    pngHeader.writeUInt32BE(32, 16); // width = 32
    pngHeader.writeUInt32BE(16, 20); // height = 16

    const pngFile = path.join(testDir, 'test_dim.png');
    await fs.writeFile(pngFile, pngHeader);

    const dimAction = defaultActionRegistry.get('image.get_dimensions');
    const dimRes = await dimAction.execute({ filePath: pngFile });

    assert.equal(dimRes.format, 'png');
    assert.equal(dimRes.width, 32);
    assert.equal(dimRes.height, 16);
    assert.equal(dimRes.aspectRatio, '2.00');
  });

  test('system.get_info and system.delay should retrieve hardware metrics and pause execution', async () => {
    const infoAction = defaultActionRegistry.get('system.get_info');
    const info = await infoAction.execute({});

    assert.ok(info.platform);
    assert.ok(info.arch);
    assert.ok(info.cpuCount >= 1);
    assert.ok(info.totalMemoryMB > 0);

    const delayAction = defaultActionRegistry.get('system.delay');
    const t0 = performance.now();
    const delayRes = await delayAction.execute({ milliseconds: 20 });
    const elapsed = performance.now() - t0;

    assert.equal(delayRes.delayedMs, 20);
    assert.ok(elapsed >= 15);
  });

  test('WorkflowEngine should handle per-step conditions and step retries', async () => {
    const engine = new WorkflowEngine({
      platform: 'windows',
      grantedCapabilities: Object.values(Capabilities)
    });

    let failCount = 0;
    defaultActionRegistry.register({
      id: 'test.flaky_action',
      name: 'Flaky Test Action',
      category: 'developer',
      requiredCapabilities: [],
      async execute() {
        if (failCount < 2) {
          failCount++;
          throw new Error('Temporary glitch');
        }
        return { recovered: true };
      }
    });

    const workflowWithRetry = {
      id: 'test_retry_wf',
      name: 'Retry & Condition Test',
      platforms: ['windows'],
      permissions: [],
      steps: [
        {
          id: 'step_skipped',
          actionId: 'text.clean_url',
          condition: { left: '1', operator: 'equals', right: '2' },
          parameters: { text: 'http://skipped.com' }
        },
        {
          id: 'step_retry',
          actionId: 'test.flaky_action',
          retries: 3,
          retryDelayMs: 10,
          parameters: {}
        }
      ]
    };

    const res = await engine.execute(workflowWithRetry);

    assert.equal(res.status, ExecutionStatus.SUCCESS);
    assert.equal(res.stepResults[0].status, 'skipped');
    assert.equal(res.stepResults[1].status, 'success');
    assert.equal(res.stepResults[1].attempts, 3);
  });
});
