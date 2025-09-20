
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const chat = ai.chats.create({
  model: "gemini-2.0-flash",
  config: {
    systemInstruction: process.env.PROMPT,
    maxOutputTokens: 500,
    temperature: 0.1,
  },
});

const chat2 = ai.chats.create({
  model: "gemini-2.0-flash",
  config: {
    systemInstruction: process.env.PROMPT2,
    maxOutputTokens: 500,
    temperature: 0.1,
  },
});

export const aiBot = async (message) => {
  const response = await chat.sendMessage({ message });
  return response.text;
};

const creativeMiddleware = async (message) => {
  const response = await chat2.sendMessage({ message });
  return response.text;
};

chat.use(creativeMiddleware);
