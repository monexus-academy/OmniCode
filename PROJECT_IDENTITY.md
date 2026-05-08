# Project Identity

This project is intended to use the Monexus company account path only.

Expected Git identity:
- Name: `Monexus Support`
- Email: `support@monexus.com`

Expected GitHub push path:
- Preferred SSH alias: `github-monexus`
- Preferred remote format: `git@github-monexus:OWNER/REPO.git`
- SSH public key to add to the Monexus GitHub account: `C:\Users\Rafael Alvizo\.ssh\id_ed25519_monexus_support_github.pub`

Expected Vercel path:
- Vercel account/team should be the Monexus company account for `support@monexus.com`
- Once linked, `.vercel/project.json` should identify the correct Vercel org and project for this repo

Quick checks:
- `git config --local --get user.name`
- `git config --local --get user.email`
- `git remote -v`
- `ssh -T git@github-monexus`
- `vercel whoami`
- `type .vercel\project.json`

When the GitHub repo exists:
- `git remote add origin git@github-monexus:OWNER/REPO.git`

When the Vercel account is authenticated:
- `vercel link`

Recommended habit:
- Run `powershell -ExecutionPolicy Bypass -File .\scripts\check-project-identity.ps1` before `git push` or `vercel`.
