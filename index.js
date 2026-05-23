import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { handleIncomingMessage } from "./agent.js";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;

app.get("/", (req, res) => {
  res.send("Cool Service WhatsApp Agent is running!");
});

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified!");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object !== "whatsapp_business_account") return res.sendStatus(404);

  const entry = body.entry?.[0]?.changes?.[0]?.value;
  const message = entry?.messages?.[0];

  if (!message || message.type !== "text") return res.sendStatus(200);

  const from = message.from;
  const userText = message.text.body;

  console.log(`Message from ${from}: ${userText}`);

  try {
    await handleIncomingMessage(from, userText);
  } catch (err) {
    console.error("Agent error:", err.message);
  }

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
