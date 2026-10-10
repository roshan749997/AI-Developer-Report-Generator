# AI Developer Report Generator âš¡

> **Automated technical progress and developer productivity reports powered by Google Gemini and OpenAI.**

[![React 19](https://img.shields.io/badge/React-19.0.0-61DAFB?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green?style=flat&logo=node.js)](https://nodejs.org)
[![Tailwind CSS v4](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com)

---

## ðŸ“Œ Overview

**AI Developer Report Generator** is a production-grade monorepo designed to eliminate manual developer status reporting. By connecting with Git repositories and task histories, the application analyzes recent commits and changes to automatically generate comprehensive executive summaries, technical documentation, and sprint reports in PDF and DOCX formats.

---

## âœ¨ Features

- ðŸ¤– **Multi-Model Intelligence:** Integrates `@google/genai` (Google Gemini) and `openai` for nuanced code understanding.
- ðŸ“¦ **Monorepo Architecture:** Clean NPM workspace separation between `backend` (Express, TypeScript) and `frontend` (React 19, Vite).
- ðŸ“„ **Multi-Format Export:** Generates clean, formatted `.docx` and `.pdf` reports directly from AI output using `docx` and `pdf-lib`.
- ðŸ” **Security & Reliability:** Built with `helmet`, `express-rate-limit`, `zod` validation, and structured `pino` logging.
- ðŸŽ¨ **Modern Interface:** Sleek, accessible UI using React 19, TanStack Query v5, Lucide icons, and Tailwind CSS v4.

---

## ðŸ—ï¸ Architecture
