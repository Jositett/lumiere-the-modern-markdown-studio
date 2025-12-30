# Cloudflare Workers Full-Stack Chat Demo

[cloudflarebutton]

A production-ready full-stack chat application built on Cloudflare Workers, featuring Durable Objects for multi-tenant data isolation, React frontend with shadcn/ui, and Hono for API routing. Demonstrates users, chat boards, and real-time messaging with indexed listing and pagination.

## ✨ Key Features

- **Durable Objects**: One DO per user/chat for strong consistency and isolation
- **Indexed Listing**: Efficient pagination with prefix indexes
- **Full-Stack TypeScript**: Shared types between frontend and worker
- **Modern UI**: shadcn/ui with Tailwind CSS, dark mode, animations
- **React Query**: Optimistic updates and caching
- **Hono Routing**: Fast, type-safe API with CORS and logging
- **Bun-Powered**: Fast installs and dev server
- **Cloudflare Native**: Workers, DOs, SPA assets handling
- **Seed Data**: Auto-populates demo users/chats on first run

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Lucide Icons, Tanstack Query, React Router, Framer Motion, Sonner
- **Backend**: Cloudflare Workers, Hono, Durable Objects
- **Data**: SQLite-backed DO storage with CAS for concurrency
- **Dev Tools**: Bun, ESLint, Wrangler
- **Utilities**: Immer, Zod, UUID, Date-fns

## 🚀 Quick Start

1. **Clone & Install**
   ```bash
   git clone <your-repo-url>
   cd lumiere-markdown-stu-bkipxmx9s8dnqxpfik3to
   bun install
   ```

2. **Development**
   ```bash
   bun run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) (or `$PORT`).

3. **Type Generation**
   ```bash
   bun run cf-typegen
   ```

## 💻 Development

- **Frontend**: `src/` – React app with Vite
- **Backend**: `worker/` – Hono app with entities in `entities.ts`
- **Shared**: `shared/` – Types and mock data
- **Custom Routes**: Add to `worker/user-routes.ts`, auto-reloads
- **Entities**: Extend `IndexedEntity` in `worker/entities.ts`
- **Lint**: `bun run lint`
- **Preview**: `bun run preview`
- **Theme**: Toggle dark/light mode via UI

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List users (paginated) |
| POST | `/api/users` | Create user `{name}` |
| DELETE | `/api/users/:id` | Delete user |
| POST | `/api/users/deleteMany` | Bulk delete |
| GET | `/api/chats` | List chats |
| POST | `/api/chats` | Create chat `{title}` |
| GET | `/api/chats/:chatId/messages` | List messages |
| POST | `/api/chats/:chatId/messages` | Send message `{userId, text}` |

All responses: `{success: boolean, data?: T, error?: string}`

## ☁️ Deployment

1. **Build Assets**
   ```bash
   bun run build
   ```

2. **Deploy to Cloudflare**
   ```bash
   bun run deploy
   ```
   Or use Wrangler CLI: `npx wrangler deploy`

[cloudflarebutton]

**Configure Secrets** (optional):
```bash
wrangler secret put YOUR_SECRET
```

**Custom Domain**: Update `wrangler.jsonc` and `workers.dev` bindings via dashboard.

## 📚 Project Structure

```
├── shared/          # Shared types & mocks
├── src/             # React frontend
├── worker/          # Hono + Durable Objects backend
├── tsconfig*.json   # TypeScript configs
├── vite.config.ts   # Vite bundler
└── wrangler.jsonc   # Workers config
```

## 🤝 Contributing

1. Fork & clone
2. `bun install`
3. `bun run dev`
4. Add features to `src/` or `worker/user-routes.ts`
5. `bun run lint`
6. PR with clear description

## 🔒 License

MIT – see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

Built on Cloudflare Workers, shadcn/ui, Hono, and open-source magic. 🚀