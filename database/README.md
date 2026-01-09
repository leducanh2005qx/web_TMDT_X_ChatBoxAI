Migration: create order_logs table

To add order logs table to the database, run the SQL file:

mysql -u root -p ecommerce < migrations/001_create_order_logs.sql

Or execute the contents of `migrations/001_create_order_logs.sql` in your DB client (phpMyAdmin, MySQL Workbench, etc.).

This adds the `order_logs` table used by the backend to store order changes (created, status updates, etc.).
