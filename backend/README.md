Order logging changes

New DB migration:

- `database/migrations/001_create_order_logs.sql` — creates `order_logs` table

New endpoints:

- GET /api/orders/:id/logs (user) — returns logs for the specified order (user must own the order)
- GET /api/orders/admin/:id/logs (admin) — returns logs for specified order (no owner check)

Behavior updates:

- When an order is created, a `created` log is inserted.
- When order status is updated via `PUT /api/orders/admin/:id/status`, a `status_updated` log is inserted recording old and new status.

How to apply migration:
mysql -u root -p ecommerce < database/migrations/001_create_order_logs.sql

Notes:

- Logs are written best-effort: failures to write logs are logged to server console but do not block main flow.
