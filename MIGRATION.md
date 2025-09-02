# Migration

The app no longer depends on previous vendor and now runs as a standard Vite + React
project with a simple Node API.

## Run locally
1. Install dependencies: `npm install`
2. Start the API server: `npm start`
3. In another terminal run the frontend: `npm run dev`
4. Visit http://localhost:5173

## Deploy
- Build the frontend with `npm run build` and deploy the `dist` folder to
  any static host.
- The API in `server/index.js` is a plain Node server and can be deployed
to providers like Vercel, Netlify, Render or any Node environment.

## Notes
- Authentication, storage and file processing are stub implementations.
  Replace them with real services (JWT, database, S3, etc.) as needed.
- Environment variables expected by the server are documented in `.env.example`.
