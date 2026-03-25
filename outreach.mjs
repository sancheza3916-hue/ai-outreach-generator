import fs from "fs";
import OpenAI from "openai";
import { parse } from "csv-parse/sync";
import "dotenv/config";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const csvFile = process.argv[2];
const tone = process.argv[3] || "friendly";
const maxWords = process.argv[4] || "80";

if (!csvFile) {
  console.log("Usage: node outreach.mjs leads.csv [tone] [maxWords]");
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

async function generateOutreach(lead) {
  const business = lead.business || "this business";
  const neighborhood = lead.neighborhood || "their area";
  const type = lead.type || "small business";
  const channel = lead.channel || "email";
  const painPoint = lead.pain_point || "customer follow-up";

  const prompt = `
Write a short ${tone} outreach message for a small business.

Business: ${business}
Neighborhood: ${neighborhood}
Type: ${type}
Channel: ${channel}
Pain point: ${painPoint}

Rules:
- Keep it under ${maxWords} words
- Make it sound natural and personalized
- Mention the business name
- Make the message feel relevant to a ${type}
- Reference the pain point in a helpful way
- Match the style to the channel:
  - If channel is instagram, make it feel like a DM
  - If channel is email, make it feel like a cold email
- End with a soft, low-pressure call to action
`;

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
  });

  return response.output_text.trim();
}

async function main() {
  const results = [];

  for (const lead of records) {
    try {
      console.log(`Generating for ${lead.business}...`);
      const message = await generateOutreach(lead);

      results.push({
        business: lead.business,
        neighborhood: lead.neighborhood,
        type: lead.type,
        channel: lead.channel,
        pain_point: lead.pain_point,
        message,
      });
    } catch (error) {
      console.error(`Error with ${lead.business}:`, error.message);
      results.push({
        business: lead.business,
        neighborhood: lead.neighborhood,
        type: lead.type,
        channel: lead.channel,
        pain_point: lead.pain_point,
        message: "ERROR GENERATING MESSAGE",
      });
    }
  }

  const outputLines = [
    "business,neighborhood,type,channel,pain_point,message",
    ...results.map((row) => {
      const safeMessage = `"${String(row.message).replace(/"/g, '""')}"`;
      return `${row.business},${row.neighborhood},${row.type},${row.channel},${row.pain_point},${safeMessage}`;
    }),
  ];

  const outputFile = `outreach_output_${Date.now()}.csv`;
  fs.writeFileSync(outputFile, outputLines.join("\n"));

  console.log(`Done. Output saved to ${outputFile}`);
}

main();