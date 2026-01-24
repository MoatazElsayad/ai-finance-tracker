export const CHART_COLORS = {
  income: '#10b981', // emerald-500
  expense: '#ef4444', // red-500
  savings: '#f59e0b', // amber-500
  accent: '#f59e0b',  // amber-500
  categories: [
    '#f59e0b', // amber-500
    '#fbbf24', // amber-400
    '#fcd34d', // amber-300
    '#fb923c', // orange-400
    '#f97316', // orange-500
    '#10b981', // emerald-500
    '#34d399', // emerald-400
    '#0ea5e9', // sky-500
    '#38bdf8', // sky-400
    '#8b5cf6', // violet-500
    '#a78bfa', // violet-400
    '#ec4899', // pink-500
    '#f472b6', // pink-400
  ],
  primary: '#f59e0b',
  secondary: '#ef4444',
  tertiary: '#10b981',
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
