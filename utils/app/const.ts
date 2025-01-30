export const OPENAI_API_HOST =
  process.env.OPENAI_API_HOST || 'https://api.openai.com';

export const DEFAULT_MODEL = {
  id: 'gpt-3.5-turbo',
  name: 'GPT-3.5',
  maxLength: 12000,
  tokenLimit: 4000,
};
