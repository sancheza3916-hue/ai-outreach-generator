import fs from "fs";
import OpenAI from "openai";
import { parse } from "csv-parse/sync";
import "dotenv/config";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const csvFile = process.argv[2];

if (!csvFile) {
  console.log("Usage: node score-leads.mjs leads.csv");
  process.exit(1);
}

if (!fs.existsSync(csvFile)) {
  console.log(`File not found: ${csvFile}`);
  process.exit(1);
}

const csvContent = fs.readFileSync(csvFile, "utf-8");

const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
});

async function scoreLead(lead) {
  const business = lead.business || "Unknown";
  const neighborhood = lead.neighborhood || "Unknown";
  const type = lead.type || "small business";
  const channel = lead.channel || "unknown";
  const painPoint = lead.pain_point || "none listed";

  const prompt = `
You are a lead qualification assistant for a marketing agency targeting small businesses.

Score this lead from 1-10 based on how likely they are to need and pay for AI-powered marketing help.

Business: ${business}
Neighborhood: ${neighborhood}
Type: ${type}
Current channel: ${channel}
Pain point: ${painPoint}

Score using these criteria:
1. BUSINESS QUALITY (is this a real, active business that can afford services?)
2. DIGITAL WEAKNESS (are they using low-effort channels or missing obvious digital presence?)
3. PAIN POINT CLARITY (is the pain point specific and solvable with AI/automation?)
4. NICHE FIT (are they in a niche where AI marketing help has high demand — cafes, gyms, salons, clinics, etc?)

Respond in EXACTLY this format with nothing else:
SCORE: [number 1-10]
REASON: [one sentence explaining the score]
TOP_PRIORITY: [yes or no — yes means score 8+]
`;

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
  });

  return response.output_text.trim();
}

function parseScoreResponse(text) {
  const scoreLine = text.match(/SCORE:\s*(\d+)/);
  const reasonLine = text.match(/REASON:\s*(.+)/);
  const priorityLine = text.match(/TOP_PRIORITY:\s*(yes|no)/i);

  return {
    score: scoreLine ? parseInt(scoreLine[1]) : 0,
    reason: reasonLine ? reasonLine[1].trim() : "Could not parse reason",
    topPriority: priorityLine ? priorityLine[1].toLowerCase() : "no",
  };
}

async function main() {
  const results = [];

  for (const lead of records) {
    try {
      console.log(`Scoring ${lead.business}...`);
      const raw = await scoreLead(lead);
      const parsed = parseScoreResponse(raw);

      results.push({
        business: lead.business,
        neighborhood: lead.neighborhood,
        type: lead.type,
        channel: lead.channel,
        pain_point: lead.pain_point,
        score: parsed.score,
        reason: parsed.reason,
        top_priority: parsed.topPriority,
      });
    } catch (error) {
      console.error(`Error scoring ${lead.business}:`, error.message);
      results.push({
        business: lead.business,
        neighborhood: lead.neighborhood,
        type: lead.type,
        channel: lead.channel,
        pain_point: lead.pain_point,
        score: 0,
        reason: "ERROR",
        top_priority: "no",
      });
    }
  }

  // Sort by score, highest first
  results.sort((a, b) => b.score - a.score);

  // Build output CSV
  const header = "business,neighborhood,type,channel,pain_point,score,reason,top_priority";
  const rows = results.map((r) => {
    const safeReason = `"${String(r.reason).replace(/"/g, '""')}"`;
    return `${r.business},${r.neighborhood},${r.type},${r.channel},${r.pain_point},${r.score},${safeReason},${r.top_priority}`;
  });

  const outputFile = `scored_leads_${Date.now()}.csv`;
  fs.writeFileSync(outputFile, [header, ...rows].join("\n"));

  // Print summary to terminal
  console.log("\n--- LEAD SCORES (ranked) ---\n");
  for (const r of results) {
    const flag = r.top_priority === "yes" ? " ★ TOP PRIORITY" : "";
    console.log(`[${r.score}/10] ${r.business} — ${r.reason}${flag}`);
  }

  console.log(`\nDone. Saved to ${outputFile}`);
}

main();
