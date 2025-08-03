# 2025-07-20

Tonight I've given up on using AI to write vibecard and resorted to doing it myself. For some reason I want this to be serverless and hosted in Vercel, so I've reached out to lots of these random third parties like Supabase and Upstash.. might come to regret it lol.

In abandoning AI though I've realised how I work. I take a project and identify the risk points:

1. How can I do authentication that only uses one-time password / magic link? (this is to eep it simple and make it seem like less commitment)
2. How can I generate AI images in a background process while using Vercel? (Answer: you can't, that's where Upstash Q comes in)
3. If the user gets part way through their journey and abandons it, then comes back, what happens?

As of today:

- the logic of a returning customer is still up for grabs, this needs to be managed in the middleware
- nothing is stored in the database, other than technically the user in auth
- we do not speak to openai
- we do not speak to clicksend
- we do not speak to upstash yet

To-dos on return:

- Enlist upstash queue to handle image generation
- Store user session data in Supabase
- Handle customer flow-logic based on whether they are returning or not
