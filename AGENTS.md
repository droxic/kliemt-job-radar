# kliemt-job-radar — Job Radar (newest tool)

Vue 3 + Vite SPA. For a dismissed employee, finds **external job openings** on the market that
the company could point them to. The actual search runs in an **Azure AI Function**, invoked by
`kliemt-api`'s `job-radar` module. **No own database** — auth + data via `kliemt-api`.

> Part of the KTS ecosystem. Big-picture/auth/deploy: **`Kliemt-SST/CLAUDE.md`**.
> Same Vue OAuth-client pattern as **kliemt-vlt** (reference impl) — see its `CLAUDE.md`.

## Run / build

- `yarn dev` — proxies `/api` → `http://localhost:3001`. `yarn build` uses `--base=/job-radar/`.
- Env `.env`: `VITE_OAUTH_CLIENT_ID`, `VITE_SST_URL=/sst`, `VITE_JOB_RADAR_CLIENT_URL`.

## Job-radar-specifics

- Cloned from the vlt/spe scaffolding (same project/employee list components + auth). PKCE
  verifier and `persisted_job_radar_*` cookies are namespaced for this app. Ingress path `/job-radar`.
- Main view: `src/views/JobRadarView.vue`. It drives the API endpoints under `/api/job-radar/*`:
  - `POST /job-radar/process-playground` — ad-hoc prompt (admin/lawyer), not saved.
  - `POST /job-radar/runs` — persisted run; results in `job_radar_prompt_run_results`.
  - `.../curated` — promote results to `job_radar_curated_matches`.
- **Admin/lawyer only** features (the API enforces the role check).
- Backend prompt/result schema: `kliemt-api/src/models/job-radar-*.ts` and
  `kliemt-api/src/job-radar/job-radar.service.ts`. The DB tables were added by the SST migration
  `*_create_job_radar_prompt_tables`.
- German-first (`vue-i18n`). Deploy: `./deploy.sh` → `kliemt.azurecr.io/kts-job-radar`.
