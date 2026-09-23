# Indian Cinema

A warm, cinematic professional network for the Indian film industry. Built as a React + Vite frontend with an Express + JWT API and MongoDB-ready Mongoose models.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:4000/api/health

The frontend includes a polished demo mode so the cinematic experience works immediately. The API is ready for signup/login, profiles, posts, comments, likes, search, and connection requests once MongoDB is available.

## Product flow

1. Warm onboarding: choose a region, role, and name.
2. Studio dashboard: personalized greeting, composer, feed, appreciation actions, and daily creative streak.
3. Network: find collaborators by name, role, or region and send connection invitations.
4. Profile: credits-ready artist profile with achievement badges.

## Backend

Set `MONGODB_URI` in `.env` to a MongoDB database. JWT and bcrypt authentication are implemented in `server/index.js`; schemas live in `server/models.js`. In production, use a strong `JWT_SECRET`, validate uploads, add rate limiting, and serve the built client behind the API.
