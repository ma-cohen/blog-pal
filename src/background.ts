// BlogPal Background Service Worker
// Handles OpenAI and Ollama API calls

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are a writing assistant that refines text while preserving the author's unique voice and tone.

Your task is to:
1. Fix all grammar and spelling errors
2. Improve punctuation and sentence structure
3. Enhance clarity and readability
4. Maintain the original tone, style, and personality of the writing
5. Keep the same level of formality (casual stays casual, formal stays formal)
6. Preserve any intentional stylistic choices

Important:
- Do NOT change the meaning or intent of the text
- Do NOT add new ideas or remove existing ones
- Do NOT make the text longer unless necessary for clarity
- Do NOT change the perspective (first person stays first person, etc.)
- Return ONLY the refined text, no explanations or comments`;

interface Settings {
  provider?: 'openai' | 'ollama';
  openaiApiKey?: string;
  ollamaUrl?: string;
  ollamaModel?: string;
}

interface RefineTextRequest {
  action: 'refineText';
  text: string;
}

interface RefineTextResponse {
  refinedText?: string;
  error?: string;
}

interface OpenAIResponse {
  choices?: {
    message?: {
      content: string;
    };
  }[];
  error?: {
    message: string;
  };
}

interface OllamaResponse {
  message?: {
    content: string;
  };
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener(
  (
    request: RefineTextRequest,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: RefineTextResponse) => void
  ): boolean => {
    if (request.action === 'refineText') {
      handleRefineText(request.text)
        .then((refinedText) => sendResponse({ refinedText }))
        .catch((error: Error) => sendResponse({ error: error.message }));

      // Return true to indicate we'll send response asynchronously
      return true;
    }
    return false;
  }
);

async function handleRefineText(text: string): Promise<string> {
  // Get settings from storage
  const settings = (await chrome.storage.local.get([
    'provider',
    'openaiApiKey',
    'ollamaUrl',
    'ollamaModel',
  ])) as Settings;
  const provider = settings.provider || 'openai';

  if (provider === 'openai') {
    if (!settings.openaiApiKey) {
      throw new Error('Please set your OpenAI API key in the BlogPal extension settings.');
    }
    return refineWithOpenAI(text, settings.openaiApiKey);
  } else {
    if (!settings.ollamaModel) {
      throw new Error('Please configure Ollama settings in the BlogPal extension.');
    }
    const ollamaUrl = settings.ollamaUrl || 'http://localhost:11434';
    return refineWithOllama(text, ollamaUrl, settings.ollamaModel);
  }
}

async function refineWithOpenAI(text: string, apiKey: string): Promise<string> {
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Please refine the following text:\n\n${text}` },
        ],
        temperature: 0.3,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorData: OpenAIResponse = await response.json().catch(() => ({}));

      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your OpenAI API key in settings.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      } else if (response.status === 500) {
        throw new Error('OpenAI service error. Please try again later.');
      } else {
        throw new Error(errorData.error?.message || 'Failed to refine text. Please try again.');
      }
    }

    const data: OpenAIResponse = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Unexpected response from OpenAI. Please try again.');
    }

    return data.choices[0].message.content.trim();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection.');
    }
    throw error;
  }
}

async function refineWithOllama(text: string, ollamaUrl: string, model: string): Promise<string> {
  try {
    // Normalize URL - prefer 127.0.0.1 over localhost for CORS consistency
    const normalizedUrl = ollamaUrl.replace('localhost', '127.0.0.1');

    const response = await fetch(`${normalizedUrl}/api/chat`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Please refine the following text:\n\n${text}` },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Model "${model}" not found. Make sure it's pulled in Ollama.`);
      } else if (response.status === 403) {
        throw new Error(
          `CORS error (403). Restart Ollama with: OLLAMA_ORIGINS="chrome-extension://*" ollama serve`
        );
      } else {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Ollama error (${response.status}): ${errorText || 'Unknown error'}`);
      }
    }

    const data: OllamaResponse = await response.json();

    if (!data.message || !data.message.content) {
      throw new Error('Unexpected response from Ollama. Please try again.');
    }

    return data.message.content.trim();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Cannot connect to Ollama. Make sure Ollama is running on ' + ollamaUrl);
    }
    throw error;
  }
}
