# Servio Restaurant Order Management

Servio is a responsive restaurant workflow app with three workspaces:

- Waiter / Customer: table selection, menu browsing, item customization, cart and order notes.
- Kitchen: live ticket queue with New, Preparing, Ready and Served statuses.
- Admin: sales overview, recent orders, menu availability and new item creation.

## Firebase setup

The app works immediately in local demo mode. To enable live Firestore sync across devices:

1. Create a Firebase project and enable Cloud Firestore.
2. Copy `.env.example` to `.env.local` and add the web app credentials from Firebase Project Settings.
3. Deploy `firestore.rules` during development.
4. Restart the development server.

The included rules are intentionally open for prototyping. Before production, add Firebase Authentication and restrict writes by role.

## Run locally

```bash
npm install
npm run dev
```

Use `npm run build` for a production build.
