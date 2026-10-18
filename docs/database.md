# Database

Supabase (Postgres). Free tier. Project: `uzwrchdektlrfurijzvr`.

---

## `users`

| Column | Type | Notes |
|---|---|---|
| `privy_did` | text | Primary key |
| `role` | text | `farmer` or `worker` |
| `wallet_address` | text | |
| `email` | text | |
| `skills` | text[] | Worker only |
| `languages` | text[] | Worker only |
| `availability_start` | date | Worker only |
| `availability_end` | date | Worker only |
| `location_country` | text | Worker only |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Updated on upsert |

---

## `jobs`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key, auto |
| `farmer_privy_did` | text | FK → `users.privy_did` |
| `title` | text | |
| `start_date` | date | |
| `end_date` | date | |
| `pay_per_hour` | numeric | |
| `hours_per_week` | int | |
| `housing` | bool | Default false |
| `tasks` | text[] | |
| `languages` | text[] | |
| `status` | text | `Open` or `Closed` |
| `created_at` | timestamptz | Auto |

---

## `chats`

| Column | Type | Notes |
|---|---|---|
| `id` | text | Primary key (custom `C-<timestamp>`) |
| `farm_id` | text | FK → `users.privy_did` |
| `worker_privy_did` | text | FK → `users.privy_did` |
| `job_id` | uuid | FK → `jobs.id` |
| `job_title` | text | Denormalised for display |
| `created_at` | timestamptz | Auto |

---

## `messages`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key, auto |
| `chat_id` | text | FK → `chats.id` |
| `sender_id` | text | Privy DID of sender |
| `sender_role` | text | `farm` or `worker` |
| `text` | text | |
| `lang` | text | ISO 639-1 code |
| `created_at` | timestamptz | Auto |

Index on `(chat_id, created_at)`.
