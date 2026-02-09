/**
 * Loggy — Configuration
 */

const CONFIG = {
  webhookUrl: "https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN",

  persons: [
    "Alice",
    "Bob",
    "Charlie",
    "Diana",
    "Eve"
  ],

  workTypes: [
    { id: "wireframe", label: "Wireframe" },
    { id: "user_story", label: "User Story" },
    { id: "maquette", label: "Maquette" },
    { id: "code_front", label: "Code Front" },
    { id: "code_back", label: "Code Back" }
  ],

  reviewer: {
    name: "Alice",
    discordId: "111111111111111111"
  },

  channelMembers: [
    "123456789012345678",
    "987654321098765432"
  ]
};
