# Goblin Lore 🚀

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

_Modern monorepo containing an edge DevOps control plane (repo-bot via
Cloudflare Workers AI) and a local TUI library (995.library)._

---

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B3263?style=for-the-badge&logo=eslint&logoColor=white)
![NPM](https://img.shields.io/badge/NPM-%23CB3837.svg?style=for-the-badge&logo=npm&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Vitest](https://img.shields.io/badge/vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)

This repository is an orchestrated suite for managing DevOps tasks, edge
capabilities via Cloudflare Workers AI, and local TUI interfaces.

> [!IMPORTANT] This project is private (`"private": true`) and is **not intended
> to be published to npm**. It is 100% self-contained.

---

## Project Structure

```text
.
├── apps/
│   ├── 995.library/         # TUI library and local interfaces
│   └── worker/              # repo-bot Cloudflare Worker edge control plane
├── packages/
│   └── 822.cloudflare/      # Cloudflare capabilities and tools
├── tsconfig.json            # Standalone TypeScript compiler configuration
├── eslint.config.js         # Native ESLint 9 flat configuration
├── prettier.config.mjs      # Native Prettier configuration
├── commitlint.config.mjs    # Native conventional commitlint configuration
└── package.json
```

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
npm run dev   # Typecheck and start the local development server (Parallel DEV)
npm run build # Typecheck and bundle the workspace (Type Safe BUILD)
```

### Quality & Testing

```sh
npm run test  # Run tests across the workspace (TESTING)
npm run check # Typecheck, run Prettier check, and run ESLint (CODE QUALITY)
npm run fix   # Format (Prettier) and automatically apply ESLint fixes (CODE QUALITY)
npm run clean # Remove compiled artifacts and TypeScript cache (RESET)
```

### Deployment

```sh
npm run ship  # Build and deploy the agent workspace to staging (SHIP)
```

### Git & Commit Workflows

Scoped conventional commits are provided with automated pre-commit staging
checks:

```sh
npm run commit:human # Run the commitizen wizard for conventional commits
```

Direct `git commit` commands remain guarded by Husky (`pre-commit`,
`commit-msg`, `pre-push`).
