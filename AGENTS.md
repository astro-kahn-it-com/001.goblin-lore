# 🤖 AGENTS.md — Workspace Guidelines & Architecture

> Operational manual, monorepo architecture, testing specifications, and coding
> standards for the `npm-worker-01` project.

---

## 1. Core Directives & Guardrails

- **System:** Standard NPM Monorepo (`workspaces: ["packages/*", "apps/*"]`). Do
  NOT introduce Nx, Lerna, Yarn, or PNPM.
- **Privacy:** Private repository (`"private": true`). Do NOT publish to public
  npm registries.
- **Git Commits:** Use standard conventional commit format via git directly:
  `git commit -m "type: description"`. Husky hooks automatically enforce build
  and staged linting.
- **TypeScript Integrity:** Strict mode is enforced. Avoid `any` where possible;
  handle `null` and `undefined` strictly. Maintain pure ESM exports.

---

## 2. Monorepo Architecture

This monorepo houses a Cloudflare Worker backend agent and an agent unit/library
layer.

```text
.
├── apps/
│   ├── worker/              # Cloudflare Worker (@camp_candor/worker)
│   │   ├── src/             # Hono router + pi-agent-cf orchestration + DO
│   │   ├── test/            # Vitest worker pool unit tests & audit tests
│   │   └── wrangler.jsonc   # Cloudflare Worker & Durable Object bindings
│   └── 995.library/         # Terminal CLI & runner harness (@camp_candor/995.library)
│       ├── run.ts           # Execution harness for pivot/hunt
│       └── test/            # AVA 6 unit tests
├── packages/
│   └── 000.agent/           # Core unit and domain library (@camp_candor/000.agent)
│       ├── BEE.ts           # Unit registration & central wiring
│       ├── 00.agent.unit/   # Agent domain unit (actions, buzzers, reducers)
│       ├── 01.model.unit/   # Model definition unit
│       ├── 97.collect.unit/ # Collection unit
│       ├── 98.menu.unit/    # Menu unit
│       ├── 99.bus.unit/     # Event bus unit
│       └── act/             # Barrel exports for cross-unit actions
└── data/                    # Project directives and documentation
```

### 2.1 Workspace Roles

| Workspace            | Package Name               | Primary Role                  | Tech Stack                                                          |
| :------------------- | :------------------------- | :---------------------------- | :------------------------------------------------------------------ |
| `apps/worker`        | `@camp_candor/worker`      | Cloudflare Worker AI Agent    | Hono, `@funtuantw/pi-agent-cf`, Durable Objects, SQLite, Workers AI |
| `apps/995.library`   | `@camp_candor/995.library` | CLI & Runner Harness          | TypeScript, TSX, Blessed / Terminal UI, Neo4j driver, AVA           |
| `packages/000.agent` | `@camp_candor/000.agent`   | Agent Unit Primitives & State | Unit-based Redux/Buzzer pattern, TypeBox, Vitest                    |

---

## 3. Testing Specifications & Runner Matrix

Each application and package uses a runner specifically chosen for its execution
environment:

| Workspace                     | Runner                                         | Environment                  | Commands                                                               |
| :---------------------------- | :--------------------------------------------- | :--------------------------- | :--------------------------------------------------------------------- |
| **`apps/worker` (Unit)**      | **Vitest** + `@cloudflare/vitest-pool-workers` | Cloudflare Miniflare Isolate | `npm run test:worker`                                                  |
| **`apps/worker` (Audit/E2E)** | **Vitest** + Playwright HTTP                   | Node.js                      | `npm run audit:local`, `npm run audit:staging`, `npm run verify:local` |
| **`apps/995.library`**        | **AVA 6** (`--import=tsx`)                     | Node.js (Isolated process)   | `npm run test:sower`                                                   |
| **`packages/000.agent`**      | **Vitest**                                     | Node.js                      | `npm run test:agent`                                                   |
| **Monorepo Suite**            | Multi-runner composite                         | —                            | `npm test`                                                             |

### 3.1 Testing Conventions

- **Never mix runners across boundaries:** Sower/Library CLI tests MUST run on
  AVA. Worker unit and audit tests MUST run on Vitest.
- **No external network I/O in unit tests:** Use `sinon` to stub `axios` or API
  calls in `apps/995.library` tests.
- **Worker unit isolation:** Unit tests in `apps/worker/test/unit/` run inside
  an in-memory worker isolate with DO persistence disabled.
- **E2E verification:** Audit tests in `apps/worker/test/audit/` validate live
  HTTP behavior against `http://localhost:8787` (local dev) or staging worker
  endpoints.

---

## 4. Workflows & Command Reference

All primary operations are driven from the repository root:

| Purpose              | Command                                 | Description                                                      |
| :------------------- | :-------------------------------------- | :--------------------------------------------------------------- |
| **Development**      | `npm run dev`                           | Runs the CLI library dev target (`apps/995.library`).            |
| **Worker Local Dev** | `npx wrangler dev` _(in `apps/worker`)_ | Starts local Cloudflare Worker on port 8787.                     |
| **Run All Tests**    | `npm test`                              | Runs worker unit tests followed by library unit tests.           |
| **Test Worker**      | `npm run test:worker`                   | Runs Vitest tests inside `apps/worker`.                          |
| **Test Library**     | `npm run test:sower`                    | Runs AVA tests inside `apps/995.library`.                        |
| **Test Agent**       | `npm run test:agent`                    | Runs Vitest tests inside `packages/000.agent`.                   |
| **Verify Local**     | `npm run verify:local`                  | Spins up dev server and executes local audit suite.              |
| **Code Formatting**  | `npm run prettier:fix`                  | Runs Prettier formatters across all files.                       |
| **Linting**          | `npm run lint:check` / `lint:fix`       | Runs ESLint 9 Flat Config.                                       |
| **Full Audit**       | `npm run check` / `npm run fix`         | Runs both Prettier and ESLint checks/fixes.                      |
| **Build**            | `npm run build`                         | Builds all workspaces with TypeScript project references.        |
| **Deployment**       | `npm run ship`                          | Builds, deploys worker to staging, and runs staging audit tests. |
| **Clean / Reset**    | `npm run reset`                         | Deletes `dist`, `node_modules`, and reinstall/rebuilds cleanly.  |

---

## 5. Architectural Patterns

### 5.1 Unit / Buzzer / Reducer Pattern (`packages/000.agent`)

Units follow a strictly decoupled, event-driven pattern:

- **Action (`*.action.ts`):** Defines action types and payload containers (e.g.
  `UpdateAgent`, `InitAgent`).
- **Reducer (`*.reduce.ts`):** Receives the action, clones the state model via
  `clone-deep` for immutability, and dispatches to a buzzer.
- **Buzzer (`buz/*.buzz.ts`):** Performs domain logic or asynchronous execution.
- **`bal.slv()` Return Mechanism:** Buzzers do not return values directly; they
  resolve execution by invoking `bal.slv({ unitBit: { ... } })`. When testing or
  mocking buzzers, always supply a fake `slv` spy.
- **Barrels (`act/`):** When adding new actions to a unit, re-export them in the
  corresponding `act/` barrel for clean consumption across other units.

### 5.2 Cloudflare Worker & Durable Objects (`apps/worker`)

- **Routing:** Built with Hono. Direct paths handle health (`GET /`) and
  fast-path model queries (`GET /oracle?prompt=...`).
- **Catch-All Agent Handler:** `app.all('/*')` delegates session management
  (`/sessions`, `/sessions/:id/prompt`, `/sessions/:id/state`) to
  `@funtuantw/pi-agent-cf`.
- **Durable Object (`AgentSessionDO`):** Manages per-session agent state,
  WebSocket subscriptions, SQLite history, and tool invocation loop.
- **Tools:** Implemented with Sinclair `TypeBox` parameter schemas and defined
  inside `tools: (_env) => [RollDice, ModulateVibe]`.

---

## 6. Coding & Style Rules

1. **Pure ESM:** All workspaces use `"type": "module"`. Always include
   appropriate extensions in imports where required by TypeScript/Node
   resolution.
2. **Path Aliasing:** Respect path mappings configured in `tsconfig.json` and
   `wrangler.jsonc` (e.g. `ajv` stub for Worker compatibility).
3. **No Dead Code:** Remove unused variables, imports, and debug artifacts
   before committing.
4. **Documentation Preservation:** Never overwrite or strip existing JSDoc
   comments and architecture notes when refactoring.
