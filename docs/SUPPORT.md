# Support Tickets

## Overview

Ticketing system for user support. Users can create tickets, reply, and track status. Admins can manage, assign, and respond.

## Ticket States

```
Open → Pending → Answered → Closed → Archived
      ↑_________________________|  (reopen)
```

| State | Description |
|-------|-------------|
| Open | New ticket, waiting for first response |
| Pending | User replied, waiting for admin |
| Answered | Admin replied, waiting for user |
| Closed | Resolved |
| Archived | Long-term storage |

## Auto Status Transitions

- User creates ticket → status: `open`
- User replies → status: `pending`
- Admin replies → status: `answered`
- User or admin closes → status: `closed`
- Reopen → status: `open`

## APIs

### User
- `POST /account/support/tickets` — Create ticket `{ subject, body? }`
- `GET /account/support/tickets` — List user's tickets (filters: `status`, `page`, `pageSize`)
- `GET /account/support/tickets/:id` — Get ticket with replies
- `POST /account/support/tickets/:id/reply` — Add reply `{ body }`
- `POST /account/support/tickets/:id/close` — Close ticket
- `POST /account/support/tickets/:id/reopen` — Reopen ticket

### Admin
- `GET /admin/support/tickets` — List all tickets
- `GET /admin/support/tickets/:id` — Get ticket details
- `POST /admin/support/tickets/:id/reply` — Reply as admin
- `POST /admin/support/tickets/:id/status` — Change status `{ status }`
- `POST /admin/support/tickets/:id/assign` — Assign to self
- `POST /admin/support/tickets/:id/reopen` — Reopen
- `GET /admin/support/stats` — Ticket stats

## Data Model

```prisma
model SupportTicket {
  userId: string
  subject: string
  body: string?
  status: 'open' | 'pending' | 'answered' | 'closed' | 'archived'
  assignedTo: string?  (admin user ID)
  replies: SupportReply[]
}

model SupportReply {
  ticketId: string
  userId: string
  body: string
}
```

## Events

- `TICKET_CREATED`, `TICKET_REPLIED`, `TICKET_STATUS_CHANGED`, `TICKET_ASSIGNED`
