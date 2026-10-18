# Database

Supabase (Postgres). Free tier.

---

## `users`

| Column | Type | Notes |
|---|---|---|
| `privy_did` | text | Primary key |
| `role` | text | `farmer` or `worker` |
| `wallet_address` | text | Embedded wallet (Privy) |
| `email` | text | Google or email login |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Updated on upsert |

---

## `chat_messages`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_did` | text | FK → `users.privy_did` |
| `thread_id` | text | Groups a conversation |
| `sender` | text | `user` or `ai` |
| `content` | text | Message body |
| `created_at` | timestamptz | Auto |

Index on `(thread_id, created_at)`.
