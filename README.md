
  # Casper App Control Panel

  This is a code bundle for Casper App Control Panel. The original project is available at https://www.figma.com/design/pSyPnm0hoqrIFtfpDSXHfY/Casper-App-Control-Panel.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Backend integration

  The frontend reads `VITE_API_BASE_URL` to connect to the Fastify backend. Copy `.env.example`
  and `backend/.env.example`, then run:

  ```bash
  pnpm backend:dev
  pnpm backend:worker
  pnpm dev
  ```

## Connecting an exchange (Bybit or Coinbase)

Casper connects to an exchange account using **API credentials** stored on the backend (encrypted at rest).

1. Start the backend + worker + frontend.
2. In **Settings**, choose **Bybit** or **Coinbase**.
3. Paste your exchange API credentials and press **SAVE API KEYS**.

Notes:
- Coinbase uses **CDP Advanced Trade keys**. The “secret” is an **EC private key PEM** (multi-line).
- Keep live trading disabled unless you understand the risks. See `BYBIT_ENABLE_LIVE_TRADING` / `COINBASE_ENABLE_LIVE_TRADING` in `backend/.env`.

  Build both backend and frontend for production with:

  ```bash
  pnpm build:production
  ```
  