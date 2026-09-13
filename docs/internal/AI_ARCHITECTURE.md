# Local AI Architecture & Natural Language Compiler: OPERON

**Document Version:** 1.0.0  
**Author:** Agent K (Local AI Engineer)  
**System Role:** Natural Language Intent-to-Workflow Compilation & On-Device Text Intelligence  

---

## 1. Core Architectural Paradigm

### "AI as the Architect, Never the Unchecked Driver"
In Operon, AI is explicitly decoupled from execution:
```
User Natural Language Input
           │
           ▼
┌─────────────────────────────────────────┐
│       Operon Local AI Compiler          │
│ 1. Intent Classification                │
│ 2. Parameter Extraction                 │
│ 3. Tool Schema Mapping                  │
│ 4. Deterministic AST / DAG Assembly     │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│     JSON Schema & Safety Validator      │
│ • Validates actions against catalog     │
│ • Checks permission boundaries          │
│ • Flags destructive commands            │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│    Interactive Plan Preview Modal       │
│ User inspects steps & approves plan     │
└─────────────────────────────────────────┘
           │
           ▼ (Upon User Approval)
┌─────────────────────────────────────────┐
│      Deterministic Execution Core       │
│ Sub-millisecond offline execution       │
└─────────────────────────────────────────┘
```

---

## 2. Multi-Tiered AI Provider Abstraction (`IAIEngine`)

```typescript
export interface IAIEngine {
  compileIntentToWorkflow(prompt: string, context?: ISystemContext): Promise<IWorkflowCompilationResult>;
  transformText(text: string, task: AITextTask): Promise<string>;
  isAvailable(): boolean;
  getProviderName(): string;
}
```

### Provider Tiers:
1. **Tier 1: Deterministic Pattern Compiler (Zero-Cost, Zero-RAM, Instant):**
   - Uses high-speed regex grammar rules and keyword extraction to parse 80% of common automation queries:
     - *"Format JSON"* -> invokes `text.format_json`
     - *"Convert PNGs to WebP in Downloads"* -> invokes `image.convert_format` + `file.batch_rename`
     - *"Strip UTM from URL"* -> invokes `text.clean_url`
   - Latency: < **1 millisecond**. Memory: **0 MB**. Works 100% offline everywhere.

2. **Tier 2: On-Device Small Language Model (SLM) via GGUF / ONNX / WebAssembly:**
   - Designed for local execution using lightweight quantized models:
     - Gemma 2B / Qwen 2.5 1.5B / Llama 3.2 1B (q4_k_m).
   - Constrained JSON generation using GBNF grammars ensuring 100% valid JSON conforming to `IWorkflow` schema.
   - Run on-device without cloud connectivity.

3. **Tier 3: User-Configured Local Server or External Provider (BYOK):**
   - Support for localhost endpoints (Ollama, LM Studio, vLLM) or optional user-provided API keys.
   - Zero vendor lock-in. Never required for core functionality.

---

## 3. Evaluation & Quality Benchmarks

We maintain a strict evaluation suite in `ai/evals/`:
- **Schema Validity:** 100% of generated workflows MUST pass JSON Schema validation.
- **Permission Precision:** No workflow should ever request broader permissions than needed.
- **Destructive Action Safety:** Destructive actions (`file.delete`, `system.shell_exec`) MUST ALWAYS trigger user confirmation flags.
- **Multilingual Support:** Evaluation covers queries in English, Russian, German, and Spanish.
