# AI Lead-Gen System

A Node.js automation system that helps small businesses get found, scored, and contacted using AI — built for speed, personalization, and scale.

## What It Does

This repo contains two tools that work together:

### Tool 1: AI Outreach Generator (`outreach.mjs`)
Takes a CSV of business leads and generates personalized outreach messages for each one — tailored by niche, channel, neighborhood, and pain point.

**Input:** `leads.csv` with business info  
**Output:** Ready-to-send outreach messages (email or DM style)

```
node outreach.mjs leads.csv [tone] [maxWords]
```

### Tool 2: AI Lead Scorer (`score-leads.mjs`)
Takes a CSV of business leads and scores each one 1–10 based on how likely they are to need and pay for AI-powered marketing help. Ranks them highest to lowest and flags top priorities.

**Scoring criteria:**
- Business quality (real, active, can afford services)
- Digital weakness (low-effort channels, missing online presence)
- Pain point clarity (specific and solvable with AI/automation)
- Niche fit (cafes, gyms, salons, clinics = high demand)

**Input:** `leads.csv` with business info  
**Output:** Ranked CSV with scores, reasons, and priority flags

```
node score-leads.mjs leads.csv
```

**Example output:**
```
[8/10] Better Buzz Coffee — Active cafe with clear automatable pain point ★ TOP PRIORITY
[8/10] Iron Tribe Fitness — Gym with no-show issues, strong niche fit ★ TOP PRIORITY
[7/10] Pacific Beach Plumbing — Clear pain point but moderate niche demand
```

## How They Work Together
1. Build a CSV of local business leads
2. Run the **scorer** to rank and prioritize them
3. Run the **outreach generator** on the top-scoring leads
4. Send personalized messages only to the best-fit prospects

## Tech Stack
- Node.js
- OpenAI API (GPT-4.1-mini)
- CSV parsing (`csv-parse`)
- Prompt engineering
- dotenv for environment config

## CSV Format
Your `leads.csv` should have these columns:

```
business,neighborhood,type,channel,pain_point
Better Buzz Coffee,Pacific Beach,cafe,Instagram DMs,Too many repeated questions during rush
```

## Setup
1. Clone the repo
2. Run `npm install`
3. Create a `.env` file with your OpenAI API key:
```
OPENAI_API_KEY=your-key-here
```
4. Add your leads to a CSV file
5. Run either tool

## Author
Built by Alfredo Sanchez — first-generation college grad, bilingual marketer, and AI tool builder based in San Diego.
