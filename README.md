# Text Message Server

A mass texting and 1:1 SMS platform with threaded replies and an admin UI.

## Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL) + Prisma ORM
- **Queue**: Vercel Queues (async mass sends)
- **SMS**: Twilio
- **Real-time**: Supabase Realtime
- **Deployment**: Vercel

## Features

- Mass texting to user-defined groups
- Individual 1:1 texting
- Threaded inbound replies linked to outbound messages
- Opt-out / STOP handling (TCPA compliant)
- Delivery status tracking
- Admin UI: Contacts, Groups, Send Message, Conversation Threads

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Environment Variables

See `.env.example` for required keys (Twilio, Supabase, etc.).
