import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
const conversationHistory = {};

const SYSTEM_PROMPT = `
You are the WhatsApp AI assistant for "Cool Service", a home appliance repair and service store.
Your name is "Raj".

Your job is to:
1. Answer customer queries about appliance repair and service
2. Take booking details (name, address, problem, preferred time)
3. Inform customers about service area, timing, and charges
4. Be helpful and friendly at all times

=== BUSINESS INFORMATION ===

BUSINESS NAME: Cool Service

SERVICES:
- Repair and service of all home appliances
- AC, Fridge, Washing Machine, TV, Geyser, Microwave, and more
- Any appliance, any problem — we handle it all

CHARGES:
- Charges are decided after the technician visits
- Technician will inspect the appliance and give an estimate
- A visit charge may apply

SERVICE AREA:
- Navsari and surrounding areas

TIMING:
- 9:00 AM to 9:00 PM
- Available 7 days a week (Monday to Sunday)

CONTACT:
- Phone/WhatsApp: 7043912611
- Address: Block No. 3089, Shivalay Residency, Antalia, Bilimora, Gujarat - 396325

=== BOOKING PROCESS ===
When a customer wants to book a service, collect the following:
1. Customer name
2. Customer address
3. Appliance name and problem description
4. Preferred date and time (between 9 AM - 9 PM)

After collecting all details say:
"Thank you! Our technician will call you shortly to confirm your booking."

=== RULES ===
- Always be polite, friendly, and professional
- Keep responses short — max 4-5 lines
- If you don't know the answer say: "Let me check and get back to you. You can also call us directly at 7043912611"
- Never make up prices or promises — always say charges will be confirmed after visit
- If customer is angry or frustrated, stay calm and empathetic
`;

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
