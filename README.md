# Indian Cinema

Indian Cinema is a warm, cinematic professional network for the Indian film industry.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`. The API runs at `http://localhost:4000`.

## Included

- React + Vite frontend with responsive crimson / marquee-amber visual system
- JWT signup and login with bcrypt password hashing
- MongoDB-ready Mongoose models for users, posts, connections, and notifications
- Profile editing with bio and credits-ready schema
- Feed creation, region filters, likes, comments API, and search
- Connection requests with accept/reject API and notification records
- Demo fallback: the UI remains explorable when MongoDB is not configured

## Persistence

Copy `.env.example` to `.env`, set `MONGODB_URI` to a MongoDB database, and replace `JWT_SECRET` with a long random secret. The frontend uses `VITE_API_URL` to locate the API.
