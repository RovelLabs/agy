/**
 * OPERON Desktop HUD Controller
 */
import { coreRecipes, WorkflowEngine, Capabilities, ExecutionStatus } from '/packages/core/src/index.js';
import { AIWorkflowCompiler } from '/ai/src/index.js';

class OperonHUDController {
  constructor() {
    this.recipes = [...coreRecipes];
    this.filteredRecipes = [...this.recipes];
    this.selectedIndex = 0;
    this.currentCategory = 'all';
    this.activeThemeIndex = 0;
    this.themes = ['graphite', 'midnight', 'oled', 'lunar'];

    this.compiler = new AIWorkflowCompiler();
    this.mockClipboard = 'https://github.com/RovelLabs/agy?utm_source=testing&ref=operon';
    
    this.engine = new WorkflowEngine({
      platform: 'windows',
      grantedCapabilities: Object.values(Capabilities),
      context: {
        clipboard: {
          readText: async () => this.mockClipboard,
          writeText: async (t) => { this.mockClipboard = t; }
        },
        notifier: {
          notify: async ({ title, message }) => this.showToast(`${title}: ${message}`)
        }
      }
    });

    this.initElements();
    this.bindEvents();
    this.render();
  }

  initElements() {
    this.searchInput = document.getElementById('opSearchInput');
    this.resultsList = document.getElementById('opResultsList');
    this.filterChips = document.querySelectorAll('.op-filter-chip');
    this.themeToggleBtn = document.getElementById('themeToggleBtn');
    this.aiStrip = document.getElementById('opAiStrip');
    this.aiDesc = document.getElementById('opAiDesc');
    this.aiCompileBtn = document.getElementById('opAiCompileBtn');
    this.modalBackdrop = document.getElementById('opModalBackdrop');
    this.modalTitle = document.getElementById('opModalTitle');
    this.modalBody = document.getElementById('opModalBody');
    this.modalCloseBtn = document.getElementById('opModalCloseBtn');
    this.modalCancelBtn = document.getElementById('opModalCancelBtn');
    this.modalExecuteBtn = document.getElementById('opModalExecuteBtn');
    this.toastContainer = document.getElementById('opToastContainer');
    this.perfMetrics = document.getElementById('opPerfMetrics');
  }

  bindEvents() {
    this.searchInput.addEventListener('input', () => this.handleSearch());
    this.searchInput.addEventListener('keydown', (e) => this.handleKeyDown(e));

    this.filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        this.filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.currentCategory = chip.dataset.category;
        this.handleSearch();
      });
    });

    this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
    this.aiCompileBtn.addEventListener('click', () => this.compileNaturalLanguage());
    
    this.modalCloseBtn.addEventListener('click', () => this.closeModal());
    this.modalCancelBtn.addEventListener('click', () => this.closeModal());
    this.modalExecuteBtn.addEventListener('click', () => this.executePendingWorkflow());
  }

  toggleTheme() {
    this.activeThemeIndex = (this.activeThemeIndex + 1) % this.themes.length;
    const nextTheme = this.themes[this.activeThemeIndex];
    document.documentElement.setAttribute('data-theme', nextTheme);
    this.showToast(`Switched theme: ${nextTheme.toUpperCase()}`);
  }

  handleSearch() {
    const query = this.searchInput.value.trim().toLowerCase();
    
    this.filteredRecipes = this.recipes.filter(r => {
      const matchCat = this.currentCategory === 'all' || r.category === this.currentCategory;
      const matchText = !query || r.name.toLowerCase().includes(query) || r.description.toLowerCase().includes(query);
      return matchCat && matchText;
    });

    this.selectedIndex = 0;
    this.render();

    // Show AI strip if query looks like a routine intent and has no direct exact title match
    if (query.length > 5 && (query.includes(' ') || this.filteredRecipes.length === 0)) {
      this.aiStrip.style.display = 'flex';
      this.aiDesc.textContent = `Compile intent "${this.searchInput.value.trim()}" into an offline routine.`;
    } else {
      this.aiStrip.style.display = 'none';
    }
  }

  handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (this.filteredRecipes.length > 0) {
        this.selectedIndex = (this.selectedIndex + 1) % this.filteredRecipes.length;
        this.render();
        this.scrollSelectedIntoView();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this.filteredRecipes.length > 0) {
        this.selectedIndex = (this.selectedIndex - 1 + this.filteredRecipes.length) % this.filteredRecipes.length;
        this.render();
        this.scrollSelectedIntoView();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.filteredRecipes.length > 0) {
        this.executeWorkflow(this.filteredRecipes[this.selectedIndex]);
      } else if (this.searchInput.value.trim().length > 0) {
        this.compileNaturalLanguage();
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (this.filteredRecipes.length > 0) {
        this.previewWorkflow(this.filteredRecipes[this.selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      this.searchInput.value = '';
      this.handleSearch();
      this.showToast('Dismissed');
    }
  }

  scrollSelectedIntoView() {
    const selectedEl = this.resultsList.querySelector('.op-result-row.selected');
    if (selectedEl) selectedEl.scrollIntoView({ block: 'nearest' });
  }

  async executeWorkflow(workflow) {
    const start = performance.now();
    try {
      const res = await this.engine.execute(workflow);
      const dur = (performance.now() - start).toFixed(2);
      this.perfMetrics.textContent = `Executed in ${dur}ms • Sub-1ms DAG`;

      if (res.status === ExecutionStatus.SUCCESS) {
        this.showToast(`✓ Completed: ${workflow.name} (${dur}ms)`);
      } else {
        this.showToast(`✕ Error: ${res.error || 'Execution failed'}`);
      }
    } catch (err) {
      this.showToast(`✕ Error: ${err.message}`);
    }
  }

  previewWorkflow(workflow) {
    this.pendingWorkflow = workflow;
    this.modalTitle.textContent = `Recipe: ${workflow.name}`;
    this.modalBody.innerHTML = `
      <p style="margin-top:0">${workflow.description}</p>
      <div style="margin: 12px 0;">
        <strong>Category:</strong> <span class="op-category-tag">${workflow.category}</span>
        <strong style="margin-left: 12px;">Platforms:</strong> ${(workflow.platforms || []).join(', ')}
      </div>
      <div style="margin: 12px 0;">
        <strong>Required Permissions:</strong>
        <ul style="margin: 4px 0; padding-left: 20px;">
          ${(workflow.permissions || ['None']).map(p => `<li><code>${p}</code></li>`).join('')}
        </ul>
      </div>
      <div>
        <strong>Steps (${workflow.steps.length}):</strong>
        <ol style="margin: 4px 0; padding-left: 20px;">
          ${workflow.steps.map(s => `<li><strong>${s.actionId}</strong>: ${JSON.stringify(s.parameters)}</li>`).join('')}
        </ol>
      </div>
    `;
    this.modalBackdrop.style.display = 'flex';
  }

  async compileNaturalLanguage() {
    const query = this.searchInput.value.trim();
    if (!query) return;

    this.showToast('Compiling intent offline...');
    const result = await this.compiler.compile(query);

    if (result.validation.valid) {
      this.previewWorkflow(result.workflowDraft);
    } else {
      this.showToast(`Compilation failed: ${result.validation.errors.join(', ')}`);
    }
  }

  executePendingWorkflow() {
    if (this.pendingWorkflow) {
      const wf = this.pendingWorkflow;
      this.closeModal();
      this.executeWorkflow(wf);
    }
  }

  closeModal() {
    this.modalBackdrop.style.display = 'none';
    this.pendingWorkflow = null;
    this.searchInput.focus();
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'op-toast';
    toast.textContent = message;
    this.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 2800);
  }

  render() {
    if (this.filteredRecipes.length === 0) {
      this.resultsList.innerHTML = `
        <div style="padding: 32px 16px; text-align: center; color: var(--op-text-tertiary);">
          <div style="font-size: 24px; margin-bottom: 8px;">∅</div>
          <div>No matching recipes found</div>
          <div style="font-size: 11px; margin-top: 4px;">Press Enter to compile your request with Local AI.</div>
        </div>
      `;
      return;
    }

    this.resultsList.innerHTML = this.filteredRecipes.map((r, i) => {
      const isSelected = i === this.selectedIndex;
      return `
        <div class="op-result-row ${isSelected ? 'selected' : ''}" data-index="${i}">
          <div class="op-result-icon">⚡</div>
          <div class="op-result-details">
            <div class="op-result-title">${r.name}</div>
            <div class="op-result-desc">${r.description}</div>
          </div>
          <div class="op-result-meta">
            <span class="op-category-tag">${r.category}</span>
            <button class="op-run-pill" data-index="${i}">Run ↵</button>
          </div>
        </div>
      `;
    }).join('');

    // Attach click handlers
    this.resultsList.querySelectorAll('.op-result-row').forEach(row => {
      const idx = parseInt(row.dataset.index, 10);
      row.addEventListener('click', () => {
        this.selectedIndex = idx;
        this.executeWorkflow(this.filteredRecipes[idx]);
      });
    });
  }
}

// Bootstrap
window.addEventListener('DOMContentLoaded', () => {
  window.operonHUD = new OperonHUDController();
});
