const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

const sarcasticResponses = [
  "Careful… one more off-topic message and I’ll have to temporarily pause your imaginary promotion 😌📉",
  "Bro, Yash Chandaramani just opened his binoculars. He’s watching this chat like a Netflix series 👀🔍😂",
  "HR just pinged me… they said they’ll fire you emotionally, not officially. Just hurt your feelings a bit 😌🔥",
  "Every time you send a non-work message, an angel loses your promotion letter 😇📄💨",
  "Keep going like this and HR might promote you… to ‘Chief Chatter Officer’ 😄📱🔥",
  "I swear your promotion is in the gym. It’s waiting for YOU to show up 😌💼🏋️‍♂️",
  "This chat is being recorded for quality… and for Yash’s entertainment 😂📹🔥",
  "One more message like this and I’ll personally request HR to put your promotion on ‘loading…’ forever ⏳😄",
  "Dude, HR is warming up their firing guns… joking, joking 😌🔫💼😂",
  "Your promotion is literally peeking around the corner like: ‘Is he working yet?’ 👀📈😂"
];

const greetingsResponses = [
  "Hey there! 😄 So good to see you!",
  "Hello! 🌟 How’s your day going?",
  "Hi! 😃 Hope you’re having an amazing day!",
  "Hey! 🙌 Great to hear from you!",
  "Hello! 😎 Ready to get some work done or just chatting today?"
];

const isWorkRelated = (message) => {
  const workKeywords = ["project", "deadline", "task", "meeting", "report", "work", "client", "office"];
  const lowerMessage = message.toLowerCase();
  return workKeywords.some(keyword => lowerMessage.includes(keyword));
};

const isGreeting = (message) => {
  const greetings = ["hi", "hello", "hey", "how are you", "good morning", "good afternoon", "good evening"];
  const lowerMessage = message.toLowerCase();
  return greetings.some(greet => lowerMessage.includes(greet));
};

const handleChat = async (req, res) => {
  let { message, chatId } = req.body;

  if (!message) return res.status(400).json({ success: false, error: "Message is required" });

  if (!chatId) chatId = uuidv4(); // generate new chatId if not provided

  try {
    let chatResponse;

    if (isGreeting(message)) {
      // Pick a random enthusiastic greeting
      chatResponse = greetingsResponses[Math.floor(Math.random() * greetingsResponses.length)];
    } else if (!isWorkRelated(message)) {
      // Pick a random sarcastic response for non-work messages
      chatResponse = sarcasticResponses[Math.floor(Math.random() * sarcasticResponses.length)];
    } else {
      // Send to OpenAI API for work-related messages
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: message }],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        }
      );

      chatResponse = response.data.choices[0]?.message?.content || "No response";
    }

    // Save chat to database here (optional)
    // Example: await saveChat(chatId, message, chatResponse);

    res.json({ success: true, response: chatResponse, chatId });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ success: false, error: "Failed to get response from ChatGPT" });
  }
};

module.exports = { chat: handleChat };