
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

  Build both backend and frontend for production with:

  ```bash
  pnpm build:production
  ```
  