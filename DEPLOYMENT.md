# Deploy AI Mystery Room on Render

This walkthrough deploys the React app and Express API together as one Render Web Service. The server serves the built client, so the browser and API share one origin. Cases are stored in MongoDB Atlas and generated with the Gemini API.

## 1. Check the project before publishing it

1. Make sure `.env` files are not staged or committed. `.gitignore` excludes them; only the `.env.example` files are safe to commit.
2. This workspace does not currently have a Git repository. In PowerShell, from the project root, initialize one and inspect the staged files before committing:

   ```powershell
   git init -b main
   git add .
   git status --short
   ```

   Confirm `server/.env` and `client/.env` are absent from the staged list. Then create the initial commit, create a private GitHub repository, add it as `origin`, and push `main`.
3. Render deploys from a linked Git repository. Do not commit a MongoDB URI or Gemini API key; Render will request these as secrets during Blueprint setup.

## 2. Prepare MongoDB Atlas

1. In Atlas, create or select a cluster. Choose a region near the Render region. The Blueprint defaults to Singapore; if your Atlas cluster is elsewhere, change `region` in `render.yaml` to a nearby Render region before deploying.
2. Create a **database user** with read/write access to the database used by this app. This is separate from your Atlas website login.
3. Copy the application connection string from **Connect → Drivers**. Keep it private. If the password contains reserved URI characters, URL-encode the password before using the URI.
4. Atlas only accepts connections from addresses in the project IP access list. After creating the Render service, open its **Connect → Outbound** panel and add the listed outbound CIDR ranges to Atlas. Add each range Render shows for the service's region. Do not use `0.0.0.0/0` for a lasting deployment.

If the first deployment fails while connecting to Atlas, the service should still appear in Render. Add its outbound ranges to Atlas, then select **Manual Deploy → Deploy latest commit**.

## 3. Create a Gemini API key

Create a key in Google AI Studio and restrict it to the Gemini API where available. Do not add the key to a client variable such as `VITE_*`, source code, or Git.

## 4. Create the Render service

1. Sign in to Render and choose **New → Blueprint**.
2. Connect your GitHub account and select the repository.
3. Render reads `render.yaml`. It builds the client and server, then starts the API. The Blueprint asks for `MONGODB_URI` and `GEMINI_API_KEY`; enter the Atlas application URI and Gemini key in Render's secret fields.
4. Wait for the deploy to finish. The health check uses `/api/v1/health`.
5. If you changed the Render service name or want to host the frontend on another domain, set `CLIENT_ORIGIN` in Render to the exact frontend origin (scheme and host, with no path). For the default single-origin setup, the app uses Render's `RENDER_EXTERNAL_URL` automatically.

The Blueprint uses Render's Free plan as a low-cost preview. Free web services can spin down after 15 minutes without traffic and the next request may take about a minute to wake them. For a production audience, choose a paid web-service plan in Render.

## 5. Verify the deployment

1. Open the service's `onrender.com` URL. The Mystery Room landing page should load.
2. Open `https://<your-service>.onrender.com/api/v1/health`; it should return `{"status":"ok"}`.
3. Create a fictional case, inspect evidence, and submit an accusation.
4. In Render logs, confirm MongoDB connects and check for safe generation errors. Never paste secret values into logs or support requests.

## Environment variables on Render

| Variable | Set in | Purpose |
|---|---|---|
| `NODE_ENV` | Blueprint | Production behavior |
| `PORT` | Render | Render supplies the listening port; do not hardcode it |
| `MONGODB_URI` | Render secret | Atlas application connection string |
| `GEMINI_API_KEY` | Render secret | Server-side Gemini authentication |
| `GEMINI_MODEL` | Blueprint | Model identifier, default `gemini-3.8-flash` |
| `CLIENT_ORIGIN` | Optional Render setting | Set only if using a separate frontend domain |

No `VITE_API_BASE_URL` is needed for the single-service deployment. The production client calls `/api/v1` on its own origin. For local development, use the values in `server/.env.example` and `client/.env.example`.

Cases and attempts have no automatic expiry in this MVP. Decide and document a retention and deletion policy before opening the service to the public.
