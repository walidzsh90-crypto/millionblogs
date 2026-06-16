# Notifications System

## Overview

In-app notification system. No email, push, or SMS — only in-app.

## Notification Types

| Type | Source |
|------|--------|
| system | Platform announcements |
| promotion | Promotion campaign events |
| wallet | Credit changes |
| subscription | Subscription lifecycle events |
| badge | Badge assignments |
| support | Support ticket updates |

## Features

- **Read/Unread**: Tracked via `readAt` timestamp
- **Archive**: Archived notifications are hidden from default view
- **Delete**: Soft delete (recoverable)
- **Bulk Mark Read**: Mark all unread notifications as read

## API

### User
- `GET /account/notifications` — List notifications (filters: `type`, `unreadOnly`, `page`, `pageSize`)
- `GET /account/notifications/unread-count` — Get unread count
- `POST /account/notifications/:id/read` — Mark as read
- `POST /account/notifications/mark-all-read` — Mark all as read
- `POST /account/notifications/:id/archive` — Archive
- `DELETE /account/notifications/:id` — Delete

## Data Model

```prisma
model Notification {
  userId: string
  type: string
  title: string
  body: string?
  data: Json?       // structured payload
  readAt: DateTime? // null = unread
  archivedAt: DateTime?
  deletedAt: DateTime?
}
```

## Events

- `NOTIFICATION_CREATED`, `NOTIFICATION_READ`, `NOTIFICATION_ARCHIVED`
