# Publish the frontend at GitHub Pages

GitHub Pages hosts the React frontend as static files. The Express API, Gemini calls, and MongoDB persistence must run on a separate backend. This project uses the Render web service in `render.yaml` for that backend and `.github/workflows/deploy-pages.yml` to publish the frontend.

## 1. Deploy the backend first

Follow [DEPLOYMENT.md](./DEPLOYMENT.md) to deploy the Render service with `MONGODB_URI` and `GEMINI_API_KEY` configured. The Render Blueprint allows the GitHub Pages origin `https://gnanendra714.github.io` for API calls.

If Render assigns a URL other than `https://ai-mystery-room.onrender.com`, set the repository variable `VITE_API_BASE_URL` to the actual API base URL, including `/api/v1` (for example, `https://your-service.onrender.com/api/v1`). This is a public URL, not a secret. The GitHub Actions workflow uses this variable when it builds the frontend.

The backend's Atlas connection also needs the Render service's outbound IP ranges in the Atlas IP access list. Use the ranges shown in the Render service's **Connect → Outbound** panel.

## 2. Enable Pages with GitHub Actions

1. Push the project, including `.github/workflows/deploy-pages.yml`, to the repository's `main` or `master` branch.
2. On GitHub, open **Settings → Pages** for the repository.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. Open the **Actions** tab and wait for **Deploy GitHub Pages** to complete. It builds only the React client and deploys `client/dist`.
5. Visit <https://gnanendra714.github.io/AI-Mystery-Room/>.

The Vite build uses the `/AI-Mystery-Room/` repository path. The Pages 404 fallback also restores client routes such as the create-case and investigation pages after a refresh.

## 3. Confirm the full game works

- The landing page should load at the URL above.
- Create a fictional case. If the API cannot be reached, check that Render is deployed and that `VITE_API_BASE_URL` is correct.
- Check that the Render service has `CLIENT_ORIGIN=https://gnanendra714.github.io`, MongoDB Atlas permits the Render outbound IP ranges, and the server logs show a successful MongoDB connection.
- Open the Render API health endpoint at `https://<your-render-service>.onrender.com/api/v1/health`; it should return `{"status":"ok"}`.

Never put `GEMINI_API_KEY` or `MONGODB_URI` in GitHub repository variables, Vite variables, or frontend code. Keep those values in Render's server-side environment settings.
