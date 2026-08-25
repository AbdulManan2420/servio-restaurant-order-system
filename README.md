# Servio Restaurant Order Management

Servio is a responsive restaurant workflow app with three workspaces:

- Waiter / Customer: table selection, menu browsing, item customization, cart and order notes.
- Kitchen: live ticket queue with New, Preparing, Ready and Served statuses.
- Admin: sales overview, recent orders, menu availability and new item creation.

## Firebase setup

The app is connected to the `servio-order-system-2420` Firebase project. The Firestore database is deployed in `asia-south1` and the local web configuration is stored in the ignored `.env.local` file.

Firebase CLI is installed as a project dependency. Useful commands:

```bash
npm run firebase:status
npm run firebase:deploy
```

Firebase Hosting URL: `https://servio-order-system-2420.web.app`

The included rules allow the three workspaces to share orders during prototyping. Before opening the app to the public, add Firebase Authentication and restrict writes by role.

## Run locally

```bash
npm install
npm run dev
```

Use `npm run build` for a production build.
