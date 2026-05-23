import axios from "axios";
import dotenv from "dotenv";
import SYSTEM_PROMPT from "./prompt.js";
dotenv.config();
const conversationHistory = {};

export async function callGroq(messages) {
  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama-3.3-70b-versatile",
      max_tokens: 500,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
    },
  );

  return response.data.choices[0].message.content;
}

export async function sendWhatsAppMessage(to, text) {
  await axios.post(
    `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to: to,
      type: "text",
      text: { body: text },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
    },
  );

  console.log(`Reply sent to ${to}`);
}

export async function handleIncomingMessage(from, userText) {
  if (!conversationHistory[from]) {
    conversationHistory[from] = [];
  }

  conversationHistory[from].push({
    role: "user",
    content: userText,
  });

  if (conversationHistory[from].length > 10) {
    conversationHistory[from] = conversationHistory[from].slice(-10);
  }

  const aiReply = await callGroq(conversationHistory[from]);

  conversationHistory[from].push({
    role: "assistant",
    content: aiReply,
  });

  await sendWhatsAppMessage(from, aiReply);
}
