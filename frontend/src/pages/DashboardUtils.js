export const CHART_COLORS = {
  income: '#00d4aa',
  expense: '#ff6b6b',
  savings: '#ffd93d',
  accent: '#4ecdc4',
  categories: [
    '#4ecdc4',
    '#45b7d1',
    '#96ceb4',
    '#ffeaa7',
    '#dda0dd',
    '#98d8c8',
    '#f7dc6f',
    '#bb8fce',
    '#85c1e9',
    '#f8c471',
    '#82e0aa',
    '#f1948a',
    '#85c1e9',
    '#d7bde2',
    '#a9dfbf',
  ],
  primary: '#00d4aa',
  secondary: '#ff6b6b',
  tertiary: '#ffd93d',
  neutral: '#64748b',
};

export function getModelInfo(modelId) {
  if (!modelId) return { name: 'AI Model', logo: '🤖', color: 'amber' };
  const modelLower = modelId.toLowerCase();
  const lobeBase =
    'https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark';

  if (modelLower.includes('openai') || modelLower.includes('gpt')) {
    return {
      name: modelLower.includes('oss') ? 'GPT-OSS' : 'ChatGPT-4o',
      logo: `${lobeBase}/openai.png`,
      color: 'slate-100',
    };
  } else if (modelLower.includes('google') || modelLower.includes('gemini') || modelLower.includes('gemma')) {
    return {
      name: modelLower.includes('gemma') ? 'Gemma 3' : 'Gemini 2.0',
      logo: modelLower.includes('gemma') ? `${lobeBase}/gemma-color.png` : `${lobeBase}/gemini-color.png`,
      color: 'blue-700',
    };
  } else if (modelLower.includes('deepseek') || modelLower.includes('chimera')) {
    return {
      name: modelLower.includes('chimera') ? 'DeepSeek Chimera' : 'DeepSeek R1',
      logo: `${lobeBase}/deepseek-color.png`,
      color: 'blue',
    };
  } else if (modelLower.includes('meta') || modelLower.includes('llama')) {
    return {
      name: 'Llama 3.3',
      logo: `${lobeBase}/meta-color.png`,
      color: 'cyan',
    };
  } else if (modelLower.includes('nvidia') || modelLower.includes('nemotron')) {
    return {
      name: 'Nemotron',
      logo: `${lobeBase}/nvidia-color.png`,
      color: 'green',
    };
  } else if (modelLower.includes('mistral') || modelLower.includes('devstral')) {
    return {
      name: modelLower.includes('devstral') ? 'Devstral' : 'Mistral 7B',
      logo: `${lobeBase}/mistral-color.png`,
      color: 'orange',
    };
  } else if (modelLower.includes('qwen')) {
    return {
      name: 'Qwen 2.5',
      logo: `${lobeBase}/qwen-color.png`,
      color: 'pink',
    };
  } else if (modelLower.includes('xiaomi') || modelLower.includes('mimo')) {
    return {
      name: 'MiMo-V2',
      logo: `${lobeBase}/xiaomimimo.png`,
      color: 'gray',
    };
  } else if (modelLower.includes('tngtech')) {
    return {
      name: 'TNG Chimera',
      logo: `${lobeBase}/tngtech.png`,
      color: 'emerald',
    };
  } else if (modelLower.includes('qwen') && modelLower.includes('coder')) {
    return {
      name: 'Qwen Coder 3',
      logo: `${lobeBase}/qwen-color.png`,
      color: 'pink',
    };
  } else if (modelLower.includes('glm') || modelLower.includes('z-ai')) {
    return {
      name: 'GLM 4.5 Air',
      logo: `${lobeBase}/zhipu-color.png`,
      color: 'blue-600',
    };
  }

  const modelName = modelId.split('/').pop().split(':')[0].replace(/-/g, ' ');
  return {
    name: modelName,
    logo: '🤖',
    color: 'amber',
  };
}
