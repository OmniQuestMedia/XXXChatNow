# How To Use Azure AI Service with GitHub Actions

This project integrates with Azure AI Service through GitHub Actions. Follow these steps to configure secrets and update your workflow.

---

## 1. Configure Repository Secrets

1. Go to your repository **Settings**.
2. Navigate to **Secrets and variables** → **Actions**.
3. Add the following two repository secrets:
   - **APIKEY** — Your Azure AI Service API key.
   - **ENDPOINT** — The endpoint URL for your Azure AI Service.

> :warning: **Do not commit secrets to the repo.** Secrets should *only* be managed via GitHub's protected mechanism.

## 2. Update Your GitHub Actions Workflow

Insert this snippet where your workflow needs Azure AI access (e.g., inside `.github/workflows/<your-workflow>.yml`):

```yaml
    - name: Use Azure AI Service
      env:
        APIKEY: ${{ secrets.APIKEY }}
        ENDPOINT: ${{ secrets.ENDPOINT }}
      run: |
        # Example usage of Azure AI Service credentials
        echo "Azure AI service endpoint: $ENDPOINT"
        # Replace this with your actual integration command
```

> **Replace the run command above with your Azure AI service invocation as needed.**

---

## Security & Compliance

- All financial, authentication, and balance-sensitive operations must remain separated from AI and workflow logic.
- Never expose, log, or commit secrets, credentials, or personal data.
- Audit and rotate API keys regularly, following least-privilege principles.

---

_For troubleshooting or further setup info, see_ [README.md](./README.md).
