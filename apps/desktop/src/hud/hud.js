/**
 * OPERON Desktop Host & Studio Controller
 */
import { coreRecipes, WorkflowEngine, defaultActionRegistry, Capabilities, ExecutionStatus, WorkflowSerializer } from '/packages/core/src/index.js';
import { AIWorkflowCompiler } from '/ai/src/index.js';
import { EntitlementTier, ProductCapability } from '/packages/entitlements/src/constants.js';

class OperonAppController {
  constructor() {
    this.currentView = 'hud';
    this.recipes = [...coreRecipes];
    this.customWorkflows = [];
    this.filteredRecipes = [...this.recipes];
    this.selectedIndex = 0;
    this.currentCategory = 'all';
    this.themes = ['graphite', 'midnight', 'oled', 'lunar'];
    this.activeTheme = 'graphite';

    this.compiler = new AIWorkflowCompiler();
    this.entitlementStatus = { tier: EntitlementTier.FREE };
    this.registry = defaultActionRegistry;
    this.mockClipboard = 'https://github.com/RovelLabs/agy?utm_source=twitter&utm_medium=social';

    this.engine = new WorkflowEngine({
      platform: 'windows',
      grantedCapabilities: Object.values(Capabilities),
      context: {
        clipboard: {
          readText: async () => this.mockClipboard,
          writeText: async (t) => {
            this.mockClipboard = t;
            this.showToast(`Clipboard Updated (${t.length} chars)`);
          }
        },
        notifier: {
          notify: async ({ title, message }) => this.showToast(`${title}: ${message}`)
        }
      }
    });

    // Studio Builder state
    this.studioWorkflow = {
      id: `wf_${Date.now()}`,
      name: 'Clean Clipboard & Convert Case',
      description: 'Strips tracking parameters from URL and converts text case.',
      category: 'text',
      platforms: ['windows', 'macos'],
      permissions: [Capabilities.CLIPBOARD_READ, Capabilities.CLIPBOARD_WRITE],
      trigger: { type: 'manual' },
      conditions: [],
      steps: [
        {
          id: 'read_clip',
          actionId: 'clipboard.read',
          parameters: {}
        },
        {
          id: 'clean',
          actionId: 'text.clean_url',
          parameters: { text: '${steps.read_clip.text}' }
        },
        {
          id: 'write_clip',
          actionId: 'clipboard.write',
          parameters: { text: '${steps.clean.cleanedText}' }
        }
      ]
    };

    this.init();
  }

  async init() {
    this.initElements();
    this.bindEvents();
    await this.initEntitlements();
    await this.loadWorkflows();
    this.renderHUD();
    this.renderStudio();
    this.renderLibrary();
    this.renderHistory();
  }

  initElements() {
    // Navigation
    this.navTabs = document.querySelectorAll('.op-nav-tab');
    this.views = document.querySelectorAll('.op-view');
    this.themeToggleBtn = document.getElementById('themeToggleBtn');
    this.proBadge = document.getElementById('opProBadge');

    // HUD Elements
    this.searchInput = document.getElementById('opSearchInput');
    this.resultsList = document.getElementById('opResultsList');
    this.filterChips = document.querySelectorAll('.op-filter-chip[data-category]');
    this.aiStrip = document.getElementById('opAiStrip');
    this.aiDesc = document.getElementById('opAiDesc');
    this.aiCompileBtn = document.getElementById('opAiCompileBtn');
    this.perfMetrics = document.getElementById('opPerfMetrics');

    // Studio Elements
    this.studioWfName = document.getElementById('studioWfName');
    this.studioWfDesc = document.getElementById('studioWfDesc');
    this.studioTriggerSelect = document.getElementById('studioTriggerSelect');
    this.studioConditionEnabled = document.getElementById('studioConditionEnabled');
    this.studioConditionBody = document.getElementById('studioConditionBody');
    this.studioCondLeft = document.getElementById('studioCondLeft');
    this.studioCondOp = document.getElementById('studioCondOp');
    this.studioCondRight = document.getElementById('studioCondRight');
    this.studioStepsContainer = document.getElementById('studioStepsContainer');
    this.studioAddStepBtn = document.getElementById('studioAddStepBtn');
    this.studioTestRunBtn = document.getElementById('studioTestRunBtn');
    this.studioSaveBtn = document.getElementById('studioSaveBtn');
    this.studioExportBtn = document.getElementById('studioExportBtn');
    this.studioImportBtn = document.getElementById('studioImportBtn');
    this.studioAiInput = document.getElementById('studioAiInput');
    this.studioAiGenerateBtn = document.getElementById('studioAiGenerateBtn');
    this.studioConsoleCard = document.getElementById('studioConsoleCard');
    this.studioConsoleOutput = document.getElementById('studioConsoleOutput');
    this.studioConsoleStatus = document.getElementById('studioConsoleStatus');

    // Library Elements
    this.libraryGrid = document.getElementById('libraryGrid');
    this.librarySearchInput = document.getElementById('librarySearchInput');
    this.libFilterChips = document.querySelectorAll('.op-filter-chip[data-lib-cat]');
    this.navRecipeCount = document.getElementById('opNavRecipeCount');

    // History Elements
    this.historyTableBody = document.getElementById('historyTableBody');
    this.historyClearBtn = document.getElementById('historyClearBtn');

    // Settings Elements
    this.themeCards = document.querySelectorAll('.op-theme-card');
    this.settingsCurrentTier = document.getElementById('settingsCurrentTier');
    this.settingsTrialBanner = document.getElementById('settingsTrialBanner');
    this.settingsStartTrialBtn = document.getElementById('settingsStartTrialBtn');
    this.settingsSandboxBuyBtn = document.getElementById('settingsSandboxBuyBtn');
    this.settingsKeyInput = document.getElementById('settingsKeyInput');
    this.settingsKeyActivateBtn = document.getElementById('settingsKeyActivateBtn');

    // Onboarding Elements
    this.onboardingLaunchBtn = document.getElementById('onboardingLaunchBtn');

    // Modals
    this.upgradeModal = document.getElementById('opUpgradeModalBackdrop');
    this.upgradeCloseBtn = document.getElementById('opUpgradeModalCloseBtn');
    this.upgradeDismissBtn = document.getElementById('opUpgradeModalDismissBtn');
    this.startTrialBtn = document.getElementById('opStartTrialBtn');
    this.activateKeyBtn = document.getElementById('opActivateKeyBtn');
    this.licenseInput = document.getElementById('opLicenseKeyInput');
    this.statusText = document.getElementById('opCurrentStatusText');
  }

  bindEvents() {
    // Navigation Tabs
    this.navTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetView = tab.dataset.view;
        this.switchView(targetView);
      });
    });

    // Theme toggle & cards
    this.themeToggleBtn.addEventListener('click', () => this.cycleTheme());
    this.themeCards.forEach(card => {
      card.addEventListener('click', () => {
        const theme = card.dataset.themeName;
        this.setTheme(theme);
      });
    });

    // HUD Input & Navigation
    this.searchInput.addEventListener('input', () => this.handleSearch());
    this.searchInput.addEventListener('keydown', (e) => this.handleHUDKeyDown(e));

    this.filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        this.filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.currentCategory = chip.dataset.category;
        this.handleSearch();
      });
    });

    this.aiCompileBtn.addEventListener('click', () => this.compileAndPreviewAI());

    // Studio Events
    this.studioAddStepBtn.addEventListener('click', () => this.addStudioStep());
    this.studioTestRunBtn.addEventListener('click', () => this.runStudioTest());
    this.studioSaveBtn.addEventListener('click', () => this.saveStudioWorkflow());
    this.studioExportBtn.addEventListener('click', () => this.exportStudioWorkflow());
    this.studioImportBtn.addEventListener('click', () => this.importStudioWorkflow());
    this.studioAiGenerateBtn.addEventListener('click', () => this.generateStudioFromAI());

    this.studioConditionEnabled.addEventListener('change', (e) => {
      this.studioConditionBody.style.display = e.target.checked ? 'block' : 'none';
    });

    // Library Events
    this.librarySearchInput.addEventListener('input', () => this.filterLibrary());
    this.libFilterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        this.libFilterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.filterLibrary();
      });
    });

    // History Events
    this.historyClearBtn.addEventListener('click', () => this.clearHistory());

    // Settings / Entitlements
    this.proBadge.addEventListener('click', () => {
      this.upgradeModal.style.display = 'flex';
    });
    this.upgradeCloseBtn.addEventListener('click', () => {
      this.upgradeModal.style.display = 'none';
    });
    this.upgradeDismissBtn.addEventListener('click', () => {
      this.upgradeModal.style.display = 'none';
    });

    this.startTrialBtn.addEventListener('click', () => this.handleStartTrial());
    this.settingsStartTrialBtn.addEventListener('click', () => this.handleStartTrial());
    this.settingsSandboxBuyBtn.addEventListener('click', () => this.handleSimulatePurchase());

    this.activateKeyBtn.addEventListener('click', () => this.handleActivateKey(this.licenseInput.value));
    this.settingsKeyActivateBtn.addEventListener('click', () => this.handleActivateKey(this.settingsKeyInput.value));

    this.onboardingLaunchBtn.addEventListener('click', () => this.switchView('hud'));

    // Global Hotkeys (Alt+Space simulation)
    window.addEventListener('keydown', (e) => {
      if (e.altKey && e.code === 'Space') {
        e.preventDefault();
        this.switchView('hud');
        this.searchInput.focus();
        this.searchInput.select();
      }
      if (e.key === 'Escape' && this.currentView === 'hud') {
        this.searchInput.value = '';
        this.handleSearch();
      }
    });
  }

  switchView(viewId) {
    this.currentView = viewId;
    this.navTabs.forEach(t => t.classList.toggle('active', t.dataset.view === viewId));
    this.views.forEach(v => v.classList.toggle('active', v.id === `view${viewId.charAt(0).toUpperCase() + viewId.slice(1)}`));

    if (viewId === 'hud') {
      setTimeout(() => this.searchInput.focus(), 50);
    } else if (viewId === 'history') {
      this.renderHistory();
    } else if (viewId === 'library') {
      this.renderLibrary();
    }
  }

  setTheme(theme) {
    this.activeTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    this.themeCards.forEach(c => c.classList.toggle('active', c.dataset.themeName === theme));
    this.showToast(`Theme switched to ${theme.toUpperCase()}`);
  }

  cycleTheme() {
    const idx = (this.themes.indexOf(this.activeTheme) + 1) % this.themes.length;
    this.setTheme(this.themes[idx]);
  }

  async initEntitlements() {
    try {
      const res = await fetch('/api/entitlements');
      if (res.ok) {
        this.entitlementStatus = await res.json();
      }
    } catch {
      this.entitlementStatus = { tier: EntitlementTier.FREE };
    }
    this.updateEntitlementUI();
  }

  updateEntitlementUI() {
    const tier = (this.entitlementStatus && this.entitlementStatus.tier) ? this.entitlementStatus.tier : EntitlementTier.FREE;
    const isPro = tier.includes('pro') || tier.includes('enterprise');

    if (this.proBadge) this.proBadge.textContent = tier.toUpperCase();
    if (this.settingsCurrentTier) this.settingsCurrentTier.textContent = tier.toUpperCase();
    if (this.statusText) this.statusText.textContent = tier.toUpperCase();

    if (isPro) {
      if (this.proBadge) {
        this.proBadge.style.color = '#22C55E';
        this.proBadge.style.borderColor = '#22C55E';
      }
      if (this.settingsTrialBanner) {
        const details = this.entitlementStatus?.isTrial 
          ? ` (${this.entitlementStatus.trialDaysRemaining} days remaining)`
          : ' (Permanent Offline License)';
        this.settingsTrialBanner.textContent = `PRO STATUS ACTIVE: Unlimited custom workflows, large-scale batch file pipelines, and local AI unlocked.${details}`;
      }
      if (this.startTrialBtn) this.startTrialBtn.style.display = 'none';
      if (this.settingsStartTrialBtn) this.settingsStartTrialBtn.style.display = 'none';
    } else {
      if (this.proBadge) {
        this.proBadge.style.color = 'var(--op-accent)';
        this.proBadge.style.borderColor = 'var(--op-accent)';
      }
      if (this.settingsTrialBanner) {
        this.settingsTrialBanner.textContent = 'FREE TIER: 30 Built-in recipes included. Upgrade to PRO for unlimited custom studio pipelines and local AI.';
      }
      if (this.startTrialBtn) this.startTrialBtn.style.display = 'inline-block';
      if (this.settingsStartTrialBtn) this.settingsStartTrialBtn.style.display = 'inline-block';
    }
  }

  async handleStartTrial() {
    try {
      const res = await fetch('/api/trial/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 14 })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        this.showToast(`14-Day Free Pro Trial Activated! (${data.daysRemaining} days remaining)`);
        await this.initEntitlements();
        if (this.upgradeModal) this.upgradeModal.style.display = 'none';
        return;
      } else {
        this.showToast(data.error || 'Trial could not be started.');
      }
    } catch (err) {
      this.showToast(`Error starting trial: ${err.message}`);
    }
  }

  async handleSimulatePurchase() {
    try {
      const res = await fetch('/api/license/simulate-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 'pro_lifetime', email: 'sandbox.tester@operon.local' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        this.showToast(`Purchase Simulated! Pro Lifetime Active. Key: ${data.issuedKey ? data.issuedKey.substring(0, 18) + '...' : ''}`);
        if (this.settingsKeyInput) this.settingsKeyInput.value = data.issuedKey || '';
        if (this.licenseInput) this.licenseInput.value = data.issuedKey || '';
        await this.initEntitlements();
        if (this.upgradeModal) this.upgradeModal.style.display = 'none';
        return;
      } else {
        this.showToast(data.error || 'Simulation failed');
      }
    } catch (err) {
      this.showToast(`Error simulating purchase: ${err.message}`);
    }
  }

  async handleActivateKey(key) {
    if (!key || !key.trim()) {
      this.showToast('Please enter an offline license key.');
      return;
    }
    try {
      const res = await fetch('/api/license/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: key.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        this.showToast('Cryptographic license key verified and activated successfully!');
        await this.initEntitlements();
        if (this.upgradeModal) this.upgradeModal.style.display = 'none';
      } else {
        this.showToast(`Activation failed: ${data.error || 'Invalid or tampered key'}`);
      }
    } catch (err) {
      this.showToast(`Error activating key: ${err.message}`);
    }
  }

  async loadWorkflows() {
    try {
      const res = await fetch('/api/workflows');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.workflows)) {
          this.recipes = data.workflows;
          this.filteredRecipes = [...this.recipes];
          if (this.navRecipeCount) this.navRecipeCount.textContent = this.recipes.length;
        }
      }
    } catch {
      // Fallback to in-memory coreRecipes
      this.recipes = [...coreRecipes];
      this.filteredRecipes = [...this.recipes];
    }
  }

  // ==================== QUICK HUD CONTROLLER ====================
  handleSearch() {
    const query = this.searchInput.value.trim().toLowerCase();
    
    this.filteredRecipes = this.recipes.filter(r => {
      const matchesCat = this.currentCategory === 'all' || r.category === this.currentCategory;
      const matchesQuery = !query || 
        r.name.toLowerCase().includes(query) || 
        r.description.toLowerCase().includes(query) ||
        r.id.toLowerCase().includes(query);
      return matchesCat && matchesQuery;
    });

    // Check if query is natural language
    if (query.length > 5 && this.filteredRecipes.length === 0) {
      this.aiStrip.style.display = 'flex';
      this.aiDesc.textContent = `Compile "${this.searchInput.value}" into a validated routine with local AI.`;
    } else {
      this.aiStrip.style.display = 'none';
    }

    this.selectedIndex = 0;
    this.renderHUD();
  }

  handleHUDKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.selectedIndex = (this.selectedIndex + 1) % Math.max(1, this.filteredRecipes.length);
      this.renderHUD();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.selectedIndex = (this.selectedIndex - 1 + this.filteredRecipes.length) % Math.max(1, this.filteredRecipes.length);
      this.renderHUD();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.aiStrip.style.display === 'flex') {
        this.compileAndPreviewAI();
      } else if (this.filteredRecipes[this.selectedIndex]) {
        this.executeRecipe(this.filteredRecipes[this.selectedIndex]);
      }
    }
  }

  renderHUD() {
    this.resultsList.innerHTML = '';

    if (this.filteredRecipes.length === 0 && this.aiStrip.style.display === 'none') {
      this.resultsList.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--op-text-tertiary); font-size: 13px;">
          No matching automation routines found. Try typing a natural routine to compile with AI.
        </div>
      `;
      return;
    }

    this.filteredRecipes.forEach((recipe, idx) => {
      const isSelected = idx === this.selectedIndex;
      const el = document.createElement('div');
      el.className = `op-recipe-row ${isSelected ? 'selected' : ''}`;
      el.style.cssText = `
        display: flex;
        align-items: center;
        padding: 10px 14px;
        gap: 12px;
        border-radius: 8px;
        cursor: pointer;
        background: ${isSelected ? 'var(--op-surface-2)' : 'transparent'};
        border: 1px solid ${isSelected ? 'var(--op-border-subtle)' : 'transparent'};
        transition: all var(--op-anim-fast);
      `;

      el.innerHTML = `
        <div style="font-family: var(--op-font-mono); font-size: 14px; width: 24px; text-align: center; color: var(--op-accent);">
          ${isSelected ? '▶' : '•'}
        </div>
        <div style="flex: 1;">
          <div style="font-size: 13px; font-weight: 600; color: var(--op-text-primary); margin-bottom: 2px;">
            ${recipe.name}
          </div>
          <div style="font-size: 11px; color: var(--op-text-secondary); line-height: 1.3;">
            ${recipe.description}
          </div>
        </div>
        <div style="display: flex; gap: 6px; align-items: center;">
          <span style="font-family: var(--op-font-mono); font-size: 10px; color: var(--op-text-tertiary); text-transform: uppercase;">
            ${recipe.category}
          </span>
          <button class="op-btn-secondary op-btn-xs" style="padding: 2px 8px;">Run</button>
        </div>
      `;

      el.addEventListener('click', () => this.executeRecipe(recipe));
      this.resultsList.appendChild(el);
    });
  }

  async executeRecipe(recipe) {
    const t0 = performance.now();
    try {
      const res = await this.engine.execute(recipe, { text: this.mockClipboard, timestamp: new Date().toISOString() });
      const duration = performance.now() - t0;
      this.perfMetrics.textContent = `Executed in ${duration.toFixed(2)}ms • Status: ${res.status}`;

      if (res.status === ExecutionStatus.SUCCESS) {
        this.showToast(`✓ "${recipe.name}" executed in ${duration.toFixed(1)}ms`);
      } else {
        this.showToast(`⚠ ${recipe.name}: ${res.error || 'Execution failed'}`);
      }

      // Log execution to history
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: recipe.id,
          workflowName: recipe.name,
          status: res.status,
          durationMs: duration,
          stepCount: (recipe.steps || []).length,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {});

    } catch (err) {
      this.showToast(`Error: ${err.message}`);
    }
  }

  async compileAndPreviewAI() {
    const prompt = this.searchInput.value.trim();
    if (!prompt) return;

    this.showToast('Compiling intent with Local AI Compiler...');
    const compiled = await this.compiler.compile(prompt);
    
    // Switch to studio builder to inspect compiled blocks
    this.studioWorkflow = compiled.workflowDraft;
    this.renderStudio();
    this.switchView('studio');
    this.showToast(`✨ Generated ${compiled.workflowDraft?.steps?.length || 0}-step automation for review!`);
  }

  // ==================== WORKFLOW STUDIO BUILDER ====================
  renderStudio() {
    this.studioWfName.value = this.studioWorkflow.name || 'Untitled Automation';
    this.studioWfDesc.value = this.studioWorkflow.description || '';
    this.studioTriggerSelect.value = this.studioWorkflow.trigger?.type || 'manual';

    const hasCondition = Array.isArray(this.studioWorkflow.conditions) && this.studioWorkflow.conditions.length > 0;
    this.studioConditionEnabled.checked = hasCondition;
    this.studioConditionBody.style.display = hasCondition ? 'block' : 'none';
    if (hasCondition) {
      const cond = this.studioWorkflow.conditions[0];
      this.studioCondLeft.value = cond.left || '';
      this.studioCondOp.value = cond.operator || 'equals';
      this.studioCondRight.value = cond.right || '';
    }

    this.renderStudioSteps();
  }

  renderStudioSteps() {
    this.studioStepsContainer.innerHTML = '';
    const allActions = this.registry.list();

    this.studioWorkflow.steps.forEach((step, idx) => {
      const card = document.createElement('div');
      card.className = 'op-step-item';

      const action = this.registry.get(step.actionId) || { name: step.actionId, description: '' };

      card.innerHTML = `
        <div class="op-step-top">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-family: var(--op-font-mono); font-weight: 700; color: var(--op-text-tertiary);">#${idx + 1}</span>
            <select class="op-select step-action-select" style="width: 240px; font-weight: 600;">
              ${allActions.map(a => `<option value="${a.id}" ${a.id === step.actionId ? 'selected' : ''}>${a.name} (${a.id})</option>`).join('')}
            </select>
            <span class="op-step-id-badge">${step.id || `step_${idx}`}</span>
          </div>
          <div class="op-step-btns">
            <button class="step-up-btn" title="Move Up" ${idx === 0 ? 'disabled' : ''}>▲</button>
            <button class="step-down-btn" title="Move Down" ${idx === this.studioWorkflow.steps.length - 1 ? 'disabled' : ''}>▼</button>
            <button class="step-del-btn" title="Delete Step" style="color: #ef4444;">✕</button>
          </div>
        </div>
        <div>
          <label class="op-form-label">Parameters (JSON or Variables like \${steps.read_clip.text})</label>
          <input type="text" class="op-input step-param-input" value="${escapeHtml(JSON.stringify(step.parameters || {}))}" />
        </div>
      `;

      // Step button bindings
      card.querySelector('.step-action-select').addEventListener('change', (e) => {
        step.actionId = e.target.value;
      });

      card.querySelector('.step-param-input').addEventListener('change', (e) => {
        try {
          step.parameters = JSON.parse(e.target.value);
        } catch {
          this.showToast('Invalid JSON in parameters. Reverting.');
        }
      });

      card.querySelector('.step-up-btn').addEventListener('click', () => {
        if (idx > 0) {
          const temp = this.studioWorkflow.steps[idx];
          this.studioWorkflow.steps[idx] = this.studioWorkflow.steps[idx - 1];
          this.studioWorkflow.steps[idx - 1] = temp;
          this.renderStudioSteps();
        }
      });

      card.querySelector('.step-down-btn').addEventListener('click', () => {
        if (idx < this.studioWorkflow.steps.length - 1) {
          const temp = this.studioWorkflow.steps[idx];
          this.studioWorkflow.steps[idx] = this.studioWorkflow.steps[idx + 1];
          this.studioWorkflow.steps[idx + 1] = temp;
          this.renderStudioSteps();
        }
      });

      card.querySelector('.step-del-btn').addEventListener('click', () => {
        this.studioWorkflow.steps.splice(idx, 1);
        this.renderStudioSteps();
      });

      this.studioStepsContainer.appendChild(card);
    });
  }

  addStudioStep() {
    const nextIdx = this.studioWorkflow.steps.length + 1;
    this.studioWorkflow.steps.push({
      id: `step_${nextIdx}`,
      actionId: 'text.clean_url',
      parameters: { text: '${steps.read_clip.text}' }
    });
    this.renderStudioSteps();
  }

  async runStudioTest() {
    this.syncStudioData();
    this.studioConsoleCard.style.display = 'block';
    this.studioConsoleStatus.textContent = 'Running...';
    this.studioConsoleOutput.textContent = 'Initializing engine runner...';

    const t0 = performance.now();
    try {
      const res = await this.engine.execute(this.studioWorkflow, { text: this.mockClipboard });
      const elapsed = (performance.now() - t0).toFixed(2);
      this.studioConsoleStatus.textContent = `${res.status} in ${elapsed}ms`;
      this.studioConsoleOutput.textContent = JSON.stringify(res, null, 2);
      this.showToast(`Test Run Finished: ${res.status}`);
    } catch (err) {
      this.studioConsoleStatus.textContent = 'ERROR';
      this.studioConsoleOutput.textContent = err.stack || err.message;
    }
  }

  async saveStudioWorkflow() {
    this.syncStudioData();
    try {
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.studioWorkflow)
      });
      if (res.ok) {
        this.showToast(`Workflow "${this.studioWorkflow.name}" saved!`);
        await this.loadWorkflows();
        this.renderLibrary();
      } else {
        const err = await res.json();
        this.showToast(`Save failed: ${err.error}`);
      }
    } catch (err) {
      this.showToast(`Error saving workflow: ${err.message}`);
    }
  }

  syncStudioData() {
    this.studioWorkflow.name = this.studioWfName.value;
    this.studioWorkflow.description = this.studioWfDesc.value;
    this.studioWorkflow.trigger = { type: this.studioTriggerSelect.value };

    if (this.studioConditionEnabled.checked) {
      this.studioWorkflow.conditions = [
        {
          left: this.studioCondLeft.value,
          operator: this.studioCondOp.value,
          right: this.studioCondRight.value
        }
      ];
    } else {
      this.studioWorkflow.conditions = [];
    }
  }

  exportStudioWorkflow() {
    this.syncStudioData();
    const exported = WorkflowSerializer.export(this.studioWorkflow);
    const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.studioWorkflow.id || 'workflow'}.operon.json`;
    a.click();
    this.showToast('Exported workflow package with SHA-256 integrity signature.');
  }

  importStudioWorkflow() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      try {
        const parsed = WorkflowSerializer.import(text);
        if (parsed.valid) {
          this.studioWorkflow = parsed.workflow;
          this.renderStudio();
          this.showToast(`Imported "${parsed.workflow.name}" successfully.`);
        } else {
          this.showToast(`Invalid workflow package: ${parsed.error}`);
        }
      } catch (err) {
        this.showToast(`Import error: ${err.message}`);
      }
    };
    input.click();
  }

  async generateStudioFromAI() {
    const prompt = this.studioAiInput.value.trim();
    if (!prompt) return;

    this.showToast('Compiling routine into blocks...');
    const res = await this.compiler.compile(prompt);
    this.studioWorkflow = res.workflowDraft;
    this.renderStudio();
    this.showToast(`Generated ${res.workflowDraft?.steps?.length || 0} visual steps!`);
  }

  // ==================== RECIPE LIBRARY ====================
  renderLibrary() {
    this.filterLibrary();
  }

  filterLibrary() {
    const query = (this.librarySearchInput?.value || '').toLowerCase();
    const activeChip = document.querySelector('.op-filter-chip[data-lib-cat].active');
    const cat = activeChip ? activeChip.dataset.libCat : 'all';

    const filtered = this.recipes.filter(r => {
      const matchesCat = cat === 'all' || r.category === cat;
      const matchesQuery = !query || r.name.toLowerCase().includes(query) || r.description.toLowerCase().includes(query);
      return matchesCat && matchesQuery;
    });

    this.libraryGrid.innerHTML = '';
    filtered.forEach(recipe => {
      const card = document.createElement('div');
      card.className = 'op-recipe-card';
      card.innerHTML = `
        <div class="op-recipe-card-header">
          <div class="op-recipe-card-title">${recipe.name}</div>
          <span style="font-family: var(--op-font-mono); font-size: 10px; color: var(--op-accent); text-transform: uppercase;">${recipe.category}</span>
        </div>
        <div class="op-recipe-card-desc">${recipe.description}</div>
        <div class="op-recipe-card-footer">
          <span style="font-size: 11px; color: var(--op-text-tertiary); font-family: var(--op-font-mono);">${recipe.steps?.length || 0} steps</span>
          <div style="display: flex; gap: 6px;">
            <button class="op-btn-secondary op-btn-xs edit-btn">Edit in Studio</button>
            <button class="op-btn-primary op-btn-xs run-btn">Run</button>
          </div>
        </div>
      `;

      card.querySelector('.run-btn').addEventListener('click', () => this.executeRecipe(recipe));
      card.querySelector('.edit-btn').addEventListener('click', () => {
        this.studioWorkflow = JSON.parse(JSON.stringify(recipe));
        this.renderStudio();
        this.switchView('studio');
      });

      this.libraryGrid.appendChild(card);
    });
  }

  // ==================== EXECUTION HISTORY ====================
  async renderHistory() {
    try {
      const res = await fetch('/api/history?limit=50');
      if (res.ok) {
        const data = await res.json();
        const history = data.history || [];
        this.historyTableBody.innerHTML = '';

        if (history.length === 0) {
          this.historyTableBody.innerHTML = `
            <tr>
              <td colspan="6" style="text-align: center; padding: 24px; color: var(--op-text-tertiary);">
                No execution history yet. Run a recipe from Quick HUD or Studio!
              </td>
            </tr>
          `;
          return;
        }

        history.reverse().forEach(h => {
          const row = document.createElement('tr');
          const isSuccess = h.status === 'success' || h.status === 0;
          const statusColor = isSuccess ? '#22c55e' : '#ef4444';

          row.innerHTML = `
            <td style="font-family: var(--op-font-mono); font-size: 11px;">${new Date(h.timestamp).toLocaleTimeString()}</td>
            <td style="font-weight: 600; color: var(--op-text-primary);">${h.workflowName || h.workflowId}</td>
            <td><span style="color: ${statusColor}; font-weight: 600; font-family: var(--op-font-mono);">${h.status}</span></td>
            <td style="font-family: var(--op-font-mono);">${Number(h.durationMs).toFixed(2)}ms</td>
            <td>${h.stepCount || 1} steps</td>
            <td><button class="op-btn-secondary op-btn-xs replay-btn">Replay</button></td>
          `;

          row.querySelector('.replay-btn').addEventListener('click', () => {
            const recipe = this.recipes.find(r => r.id === h.workflowId);
            if (recipe) this.executeRecipe(recipe);
            else this.showToast('Workflow definition no longer found in library.');
          });

          this.historyTableBody.appendChild(row);
        });
      }
    } catch {
      // Offline fallback
    }
  }

  async clearHistory() {
    this.historyTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 24px; color: var(--op-text-tertiary);">
          Audit log cleared.
        </td>
      </tr>
    `;
    this.showToast('Execution audit history cleared.');
  }

  showToast(message) {
    const container = document.getElementById('opToastContainer');
    const toast = document.createElement('div');
    toast.className = 'op-toast';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'all 150ms ease';
      setTimeout(() => toast.remove(), 160);
    }, 2500);
  }
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

window.addEventListener('DOMContentLoaded', () => {
  window.operonApp = new OperonAppController();
});
