# Vercel model setup

Login is optional. The studio works with local storage and local Ollama/LM Studio without Supabase or an account.

For a deployed app, add these **server-only** environment variables in Vercel:

- `OPENAI_API_KEY`
- `GEMINI_API_KEY`

Redeploy after saving them. In Model settings choose **OpenAI via Vercel** or **Gemini via Vercel**. The browser calls `/api/llm/openai` or `/api/llm/gemini`; the provider key stays on Vercel.

The personal-key options are useful for local development and store the key only in that browser's local storage. Do not use those options for a shared public deployment.
