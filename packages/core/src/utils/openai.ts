import fetchEventSource from './fetchEventSource.js';

// https://github.com/openai/openai-node/issues/18#issuecomment-1518715285

export type OpenAIModel = {
  maxTokens: number;
  cost: {
    prompt: number;
    completion: number;
  };
  displayName: string;
};

export const openaiModels = {
  'gpt-4': {
    maxTokens: 8192,
    cost: {
      prompt: 0.03,
      completion: 0.06,
    },
    displayName: 'GPT-4',
  },
  'gpt-4-32k': {
    maxTokens: 32768,
    cost: {
      prompt: 0.06,
      completion: 0.12,
    },
    displayName: 'GPT-4 32k',
  },
  'gpt-4-0613': {
    maxTokens: 8192,
    cost: {
      prompt: 0.03,
      completion: 0.06,
    },
    displayName: 'GPT-4 (v0613)',
  },
  'gpt-4-32k-0613': {
    maxTokens: 32768,
    cost: {
      prompt: 0.06,
      completion: 0.12,
    },
    displayName: 'GPT-4 32k (v0613)',
  },
  'gpt-3.5-turbo': {
    maxTokens: 4096,
    cost: {
      prompt: 0.002,
      completion: 0.002,
    },
    displayName: 'GPT-3.5 Turbo',
  },

  'gpt-3.5-turbo-0613': {
    maxTokens: 16384,
    cost: {
      prompt: 0.002,
      completion: 0.002,
    },
    displayName: 'GPT-3.5 (v0613)',
  },

  'gpt-3.5-turbo-16k-0613': {
    maxTokens: 16384,
    cost: {
      prompt: 0.003,
      completion: 0.004,
    },
    displayName: 'GPT-3.5 16k (v0613)',
  },
} satisfies Record<string, OpenAIModel>;

export const openAiModelOptions = Object.entries(openaiModels).map(([id, { displayName }]) => ({
  value: id,
  label: displayName,
}));

export class OpenAIError extends Error {
  constructor(readonly status: number, readonly responseJson: any) {
    super(`OpenAIError: ${status} ${JSON.stringify(responseJson)}`);
    this.name = 'OpenAIError';
  }
}

export type ChatCompletionRole = 'system' | 'assistant' | 'user' | 'function';

export type ChatCompletionRequestMessage = {
  role: ChatCompletionRole;

  /** The content of the message. */
  content: string;

  name: string | undefined;

  function_call: object | undefined;
};

// https://platform.openai.com/docs/api-reference/chat/create
export type ChatCompletionOptions = {
  endpoint: string;
  auth: { apiKey: string; organization?: string };
  headers?: Record<string, string>;
  signal?: AbortSignal;
  model: string;
  messages: ChatCompletionRequestMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  n?: number;
  stop?: string | string[];
  presence_penalty?: number;
  frequency_penalty?: number;
  logit_bias?: {
    [key: number]: number;
  };

  functions?: ChatCompletionFunction[];
};

export type ChatCompletionResponse = {
  id: string;
  object: 'text_completion';
  created: number;
  model: string;
  choices: ChatCompletionResponseChoice[];
};

export type ChatCompletionResponseMessage = {
  role: ChatCompletionRole;
  content: string;
  function_call?: object;
};

export type ChatCompletionResponseChoice = {
  index: number;
  finish_reason: 'stop' | 'length' | 'insufficient_tokens' | 'function_call';
  message: ChatCompletionResponseMessage;
};

export type ChatCompletionChunk = {
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices?: ChatCompletionChunkChoice[];
};

export type GptFunctionCall = {
  name: string;
  arguments: string;
};

export type GptFunctionCallDelta = {
  name?: string;
  arguments?: string;
};

export type ChatCompletionChunkChoice = {
  index: number;
  message_index: number;
  delta: {
    role?: 'assistant';
    content?: string;
    function_call?: GptFunctionCallDelta;
  };
  finish_reason: null | 'stop' | 'length' | 'insufficient_tokens' | 'function_call';
};

export type ChatCompletionFunction = {
  name: string;
  description: string;
  parameters: object;
};

export const DEFAULT_CHAT_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

export async function* streamChatCompletions({
  endpoint,
  auth,
  signal,
  headers,
  ...rest
}: ChatCompletionOptions): AsyncGenerator<ChatCompletionChunk> {
  const abortSignal = signal ?? new AbortController().signal;

  // Turn off timeout because local models can be slow, TODO configurable timeout
  const timeout = endpoint === DEFAULT_CHAT_ENDPOINT ? 5000 : 10000000;

  const response = await fetchEventSource(
    endpoint,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.apiKey}`,
        ...(auth.organization ? { 'OpenAI-Organization': auth.organization } : {}),
        ...headers,
      },
      body: JSON.stringify({
        ...rest,
        stream: true,
      }),
      signal: abortSignal,
    },
    timeout,
  );

  let hadChunks = false;

  for await (const chunk of response.events()) {
    hadChunks = true;

    if (chunk === '[DONE]' || abortSignal?.aborted) {
      return;
    }
    let data: ChatCompletionChunk;
    try {
      data = JSON.parse(chunk);
    } catch (err) {
      console.error('JSON parse failed on chunk: ', chunk);
      throw err;
    }

    yield data;
  }

  if (!hadChunks) {
    const responseJson = await response.json();
    throw new OpenAIError(response.status, responseJson);
  }
}
