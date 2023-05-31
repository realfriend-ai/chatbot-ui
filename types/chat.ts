import { OpenAIModel } from './openai';

export interface Message {
  role: Role;
  content: string;
}

export type Role = 'assistant' | 'user';

export interface ChatBody {
  model: OpenAIModel;
  messages: Message[];
  key: string;
  prompt: string;
}

export interface PluginStep {
  thought?: string;
  action?: string;
  actionInput?: string;
  result?: string;
  isError?: boolean;
}

export interface PluginState {
  isLoading: boolean;
  steps: PluginStep[];
  finalResult: string;
}

export interface Conversation {
  id: string;
  name: string;
  messages: Message[];
  model: OpenAIModel;
  prompt: string;
  folderId: string | null;
}
