# Repobot 🤖

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

_The deterministic DevOps Control Plane and Git Mechanic for the studio
ecosystem._

---

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B3263?style=for-the-badge&logo=eslint&logoColor=white)
![NPM](https://img.shields.io/badge/NPM-%23CB3837.svg?style=for-the-badge&logo=npm&logoColor=white)
![Vitest](https://img.shields.io/badge/vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-%23F38020.svg?style=for-the-badge&logo=cloudflare&logoColor=white)

This monorepo (goblin-lore-00) contains **repobot**, an AI agent designed to act
as a DevOps control plane and Git mechanic. It orchestrates workspace isolation,
branch scaffolding, spec commits, and PR generation.

> [!IMPORTANT] This project is private (`"private": true`) and is **not intended
> to be published to npm**.

---

## Architecture & Workspaces

The repository is a standard NPM Monorepo containing the following key
components:

```text
.
├── apps/
│   ├── worker/              # Cloudflare Worker Edge Isolate orchestrating the AI agent (@camp_candor/agent)
│   └── 995.library/         # [IMMUTABLE] Terminal Runner Harness (@camp_candor/995.library)
└── packages/
    └── 822.cloudflare/      # Cloudflare-related packages and configurations (@camp_candor/822.cloudflare)
```

- **`apps/worker`**: The Cloudflare Worker edge isolate that powers the AI agent
  (Hono router, tools for getting commits, creating branches, writing files, and
  inspecting CI checks).
- **`apps/995.library`**: The immutable terminal runner harness. It routes agent
  operations and provides the base runner.
- **`packages/822.cloudflare`**: Packages related to Cloudflare infrastructure.

---

## Getting Started

```sh
npm install
```

Clean, zero-patch install using standard npm.

---

## Commands

### Development & Execution

```sh
npm run dev   # Typecheck and start the local Vite development server
npm run build # Typecheck and bundle the production Node ESM output
npm run lib   # Run the terminal runner harness
```

### Quality & Testing

```sh
npm test           # Run Vitest test suite
npm run check      # Typecheck and run ESLint and Prettier checks
npm run fix        # Format (Prettier) and automatically apply ESLint fixes
npm run clean      # Remove compiled artifacts and TypeScript cache
```

### Deployment

```sh
npm run ship       # Build, deploy to staging, and run audit suites
```
