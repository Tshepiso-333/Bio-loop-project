// screens/manufacturer/AIAssistant/utils/constants.js

export const MESSAGE_TYPES = {
  TEXT: 'text',
};

export const STARTER_PROMPTS = [
  { id: 'inventory', label: 'How much oil do I have?' },
  { id: 'quality', label: 'Quality forecast' },
  { id: 'finance', label: 'Financial summary' },
  { id: 'deliveries', label: 'Active deliveries' },
];

export const SUGGESTED_CONVERSATION_TITLES = {
  inventory: 'Inventory check',
  quality: 'Quality forecast',
  finance: 'Financial summary',
  deliveries: 'Active deliveries',
  general: 'New conversation',
};