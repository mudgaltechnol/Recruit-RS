<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Recruit RS

## Environment Variables

Copy [.env.example](/home/lakshaymudgal/Videos/me/Recruit RS/.env.example) to `.env` and fill in your real values.

Required variables:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `AWS_S3_BUCKET`
- `AWS_S3_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

Optional variables:

- `AWS_SESSION_TOKEN`
- `AWS_S3_PUBLIC_BASE_URL`
- `AWS_S3_SIGNED_URL_TTL_SECONDS`
- `AWS_S3_RESUME_PREFIX`
- `DB_SSL`
- `RESEND_API_KEY`
- `SKIP_SEEDING`

## Run Locally

1. Install dependencies with `npm install`
2. Create `.env` from `.env.example`
3. Start the app with `npm run dev`

## EC2 Setup

1. SSH into the server
2. Go to the project folder
3. Create `.env` from `.env.example`
4. Add the required variables
5. Start the app with your process manager
