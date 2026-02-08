
# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1H-pdSrwl_HrNBRW4mwMdrMIXJFE9yBAM

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and fill in your API key:
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` to set `GEMINI_API_KEY=your_actual_api_key`
3. Run the app:
   `npm run dev`
