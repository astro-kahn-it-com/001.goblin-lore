# 📜 goblin-lore (The Legislative Canon)

> **"Simulation resolves consequences; the lore compiler establishes what is
> permitted to exist."**

`goblin-lore` is an offline, compile-time legislative schema and relational
world database. It defines the immutable somatic vectors, logistical inventory
constraints, spatial topologies, and unresolved dramatic mysteries for the
production pipeline.

It compiles human-authored Markdown dossiers into a sealed, machine-readable
`compiled/bible-state.json`[cite: 3, 13]. Downstream engines
(`worker-sower-engine`, `goblin-viewport`, and edge coordinators) consume this
state via read-only filesystem mounts or immutable Git commit SHAs, guaranteeing
$T_0 = \$0.00$ failure cost before inference or GPU diffusion runs[cite: 2, 3,
10, 12].

> [!IMPORTANT] This repository is private (`"private": true`) and is **never
> published to npm**[cite: 1, 2, 3]. It has no browser harnesses, bundlers, or
> external runtime endpoints. It operates strictly as an offline pure function
> over an append-only Git ledger[cite: 3, 12].

---

## The Core Invariants

1. **The Deletion Principle:** If all databases, Cloudflare Workers, and runtime
   caches are destroyed, canonical universe truth survives intact within the Git
   history of the `/characters`, `/grievances`, `/locations`, and `/possessions`
   Markdown dossiers[cite: 12].
2. **Byte-0 Frontmatter:** All YAML frontmatter must begin at byte 0 of the file
   (`---`)[cite: 13]. Any leading character, newline, or whitespace fails
   compilation instantly[cite: 13].
3. **Integer Basis Points:** Floating-point scalars are strictly prohibited in
   schemas[cite: 12]. All probabilities, severities, and physical dampening
   values are represented as integer basis points ($0 \le x \le 10{,}000$, where
   $10{,}000 = 1.0$)[cite: 12].
4. **Zero-Drift Tripwire:** In CI, `git diff --exit-code compiled/` runs
   immediately following compilation[cite: 12]. If Markdown dossiers are updated
   without checking in the re-compiled JSON, or if an agent attempts to spoof
   `bible-state.json` directly, the build fails immediately[cite: 12].

---

## Repository Structure

```text
goblin-lore/
├── characters/             # Agent dossiers: somatic vectors, inventory slots, epistemic beliefs
├── grievances/             # Directed social debt, escalation ceilings, cooldowns, tonal overrides
├── locations/              # Spatial topology nodes, optical opacity & centi-decibel (cdB) dampening
├── possessions/            # Physical artifacts, weight classes, custody anchors
├── world/                  # Macro-modal axioms, mythology, unresolved canon triggers
├── schemas/                # Pure Zod shape and bounds contracts (Pass 1)
│   ├── agent.schema.ts     # Somatic baselines, banned_kinetic_verbs, slot limits
│   ├── spatial.schema.ts   # Portals, dual visual/acoustic edge weights
│   ├── grievance.schema.ts # Escalation graphs, surface vs. actual wants
│   └── unresolved.schema.ts# Epistemic horizons and trigger-lemma co-occurrence sets
├── scripts/
│   ├── compile.ts          # 3-Pass compiler: Zod bounds, DAG cycle checks, POSIX atomic rename
│   └── lint-prose.ts       # Fail-closed dependency parser for affirmative somatic breaches
├── tests/
│   ├── canary.test.ts      # Test harness verification
│   ├── golden-failures/    # Deliberate malformed inputs (dangling FK, cyclic DAG, scalar bounds)
│   └── ci/
│       └── deletion.sh     # Sandboxed network-isolated build & reproduction test
├── compiled/               # Deterministic compile target (committed to Git)
│   └── bible-state.json    # Canonical state stamped with SHA-256 root hash (H_root)
├── tsconfig.json           # Strict NodeNext TypeScript configuration (noEmit: true)
├── vitest.config.ts        # Vitest configuration for invariant verification
├── eslint.config.ts        # Native ESLint 9 Flat Config
├── prettier.config.mjs     # Studio standard formatting rules
├── .husky/                 # Pre-commit hook running lint-staged
└── package.json            # Stripped private manifest (@studio/goblin-lore)

```

---

## The Three-Pass Compiler Gauntlet (`scripts/compile.ts`)

Compilation processes the corpus through three sequential, non-networked
passes[cite: 3, 13]:

```
/characters/*.md ──┐
/grievances/*.md ──┼─► [ Pass 1: Zod Bounds ] ─► [ Pass 2: Relational DAG ] ─► [ Pass 3: Hash & Seal ]
/locations/*.md  ──┤
/possessions/*.md──┘
                                                                                      │
                                                                                      ▼
                                                                          compiled/bible-state.json
                                                                           (H_root & H_entities)

```

- **Pass 1: Shape & Scalar Validation:** Isolates frontmatter via `gray-matter`
  and validates fields against Zod contracts. Asserts integer basis point
  constraints ($0 \le x \le 10{,}000$) and confirms anatomical slot limits[cite:
  12].

- **Pass 2: Relational Graph & DAG Integrity:** Sweeps all cross-file
  references[cite: 13]. Confirms that equipped possessions, active participants,
  and target locations resolve to valid files (zero dangling foreign keys)[cite:
  12]. Traverses grievance trees to mathematically prevent circular escalation
  loops ($A \to B \to A$)[cite: 12].
- **Pass 3: Deterministic Sealing & POSIX Atomic Rename:** Sorts all object keys
  lexicographically by UTF-8 code point, normalizes strings to Unicode NFC,
  strips ambient timestamps, and writes output to
  `compiled/bible-state.json.tmp_[UUIDv7]` before executing a same-filesystem
  atomic `fs.renameSync`[cite: 12, 13]. Computes the global SHA-256 canonical
  hash ($H_{\text{root}}$) and per-entity dependency hashes
  ($H_{\text{dep}}$)[cite: 12, 13].

---

## Getting Started

### Prerequisites

- Node.js $\ge 20.17.0$ (ESM native)[cite: 1]
- npm $\ge 10.0.0$

### Installation

```sh
npm install

```

Clean install using native npm without external patches or proprietary
registries[cite: 1, 2].

---

## Commands

### Compilation & State Sealing

```sh
npm run compile     # Execute scripts/compile.ts and atomically reseal compiled/bible-state.json
npm run lint:prose  # Run the fail-closed lexical scanner against character prose

```

### Quality & Invariant Testing

```sh
npm run check       # Static type evaluation (tsc --noEmit)
npm test            # Run Vitest test suite (contracts, graph acyclicity, math bounds)
npm run test:watch  # Run Vitest in interactive development mode
npm run format      # Check formatting via Prettier
npm run format:fix  # Auto-format files to studio specification
npm run clean       # Clear intermediate caches

```

### Offline Verification (The Deletion Test)

Simulates total loss of external infrastructure by severing network access,
deleting `compiled/`, and validating bit-identical reproduction from raw
Markdown[cite: 12]:

```sh
./tests/ci/deletion.sh

```

---

## CI / Verification Gauntlet

All GitHub Actions workflows are isolated and fail-closed[cite: 2]:

- **PR Verification** (`pr-checks.yml`) — Validates inbound branches against
  `main`:

1. Executes `npm run check` (zero TypeScript errors)[cite: 1, 3].
2. Runs `npm test` against the golden-failure battery[cite: 1, 12].
3. Executes `npm run compile` and verifies zero drift via
   `git diff --exit-code compiled/`[cite: 12].
4. Runs sandboxed network-isolated deletion tests to prove
   self-containment[cite: 12].

- **Anti-Tampering Dynamic Overlay** — In multi-agent environments, CI
  automatically overlays `scripts/`, `schemas/`, and test runners directly from
  `origin/main` before evaluating pull requests to prevent autonomous agents
  from weakening compiler rules or test assertions[cite: 1, 12].
