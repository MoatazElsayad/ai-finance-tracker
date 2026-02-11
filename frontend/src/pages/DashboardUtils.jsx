import React from 'react';

export const formatAISummary = (text, theme, isSimplified = false) => {
  if (!text) return null;

  if (isSimplified) {
    const isDark = theme === 'dark';
    return (
      <div className="space-y-4">
        {text.split('\n').filter(line => line.trim()).map((line, idx) => {
          const isHeader = line.startsWith('**') && line.endsWith('**');
          const isListItem = line.trim().startsWith('•') || line.trim().startsWith('-');
          
          if (isHeader) {
            const title = line.replace(/\*\*/g, '').trim();
            return (
              <h4 key={idx} className={`font-black text-[10px] uppercase tracking-[0.2em] mt-6 first:mt-0 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                {title}
              </h4>
            );
          }
          
          if (isListItem) {
            const cleanLine = line.replace(/^[•\-]\s*/, '').trim();
            return (
              <div key={idx} className="flex items-start gap-3 pl-2">
                <span className={`mt-1.5 w-1 h-1 rounded-full flex-shrink-0 ${isDark ? 'bg-slate-600' : 'bg-slate-400'}`} />
                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {cleanLine}
                </p>
              </div>
            );
          }

          return (
            <p key={idx} className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {line.replace(/\*\*/g, '').trim()}
            </p>
          );
        })}
      </div>
    );
  }

  const sections = text.split(/\*\*(.*?)\*\*/g);
  let currentSection = null;
  let sectionContent = [];
  const formattedSections = [];

  sections.forEach((section, idx) => {
    if (idx % 2 === 1) {
      if (currentSection && sectionContent.length > 0) {
        formattedSections.push({ title: currentSection, content: sectionContent.join('\n') });
      }
      currentSection = section;
      sectionContent = [];
    } else if (section.trim() && currentSection) {
      let content = section.trim();
      if (content.startsWith(':')) {
        content = content.substring(1).trim();
      }
      if (content) {
        sectionContent.push(content);
      }
    }
  });

  if (currentSection && sectionContent.length > 0) {
    formattedSections.push({ title: currentSection, content: sectionContent.join('\n') });
  }

  const getSectionAccent = (title) => {
    if (title.includes('Health') || title.includes('Financial Health')) return 'emerald';
    if (title.includes('Win') || title.includes('Success') || title.includes('Positive')) return 'green';
    if (title.includes('Concern') || title.includes('Warning') || title.includes('Alert')) return 'red';
    if (title.includes('Action') || title.includes('Recommendation') || title.includes('Suggestion')) return 'amber';
    if (title.includes('Summary') || title.includes('Overview')) return 'amber';
    if (title.includes('Trend') || title.includes('Pattern')) return 'amber';
    return 'slate';
  };

  const accentColors = {
    emerald: { border: 'border-emerald-500/30', text: 'text-emerald-400', bg: 'bg-emerald-500/5', icon: 'bg-emerald-500' },
    green: { border: 'border-green-500/30', text: 'text-green-400', bg: 'bg-green-500/5', icon: 'bg-green-500' },
    red: { border: 'border-red-500/30', text: 'text-red-400', bg: 'bg-red-500/5', icon: 'bg-red-500' },
    amber: { border: 'border-amber-500/30', text: 'text-amber-400', bg: 'bg-amber-500/5', icon: 'bg-amber-500' },
    blue: { border: 'border-blue-500/30', text: 'text-blue-400', bg: 'bg-blue-500/5', icon: 'bg-blue-500' },
    cyan: { border: 'border-cyan-500/30', text: 'text-cyan-400', bg: 'bg-cyan-500/5', icon: 'bg-cyan-500' },
    slate: { border: 'border-slate-500/20', text: 'text-slate-300', bg: 'bg-slate-500/5', icon: 'bg-slate-500' },
  };

  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      {formattedSections.map((section, idx) => {
        const accentKey = getSectionAccent(section.title);
        const colors = accentColors[accentKey];
        const hasList = section.content.includes('•') || section.content.includes('-');
        return (
          <div 
            key={idx} 
            className={`p-6 rounded-[2rem] border ${colors.border} ${colors.bg} transition-all duration-300 hover:scale-[1.01]`}
          >
            <h4 className={`font-black text-[10px] uppercase tracking-[0.2em] ${colors.text} mb-4 flex items-center gap-3`}>
              <span className={`w-2 h-2 rounded-full ${colors.icon} shadow-[0_0_10px_rgba(0,0,0,0.2)]`} />
              {section.title}
            </h4>
            <div className="pl-5">
              {hasList ? (
                <ul className="space-y-3">
                  {section.content.split('\n').filter((line) => line.trim()).map((line, i) => {
                    if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
                      const cleanLine = line.replace(/^[•\-]\s*/, '').trim();
                      return (
                        <li key={i} className={`flex items-start gap-3 ${isDark ? 'text-slate-300' : 'text-slate-700'} leading-relaxed text-sm font-medium`}>
                          <span className={`${colors.text} font-black mt-0.5 flex-shrink-0`}>→</span>
                          <span className="flex-1">{cleanLine}</span>
                        </li>
                      );
                    }
                    return (
                      <p key={i} className={`${isDark ? 'text-slate-300' : 'text-slate-700'} leading-relaxed text-sm font-medium`}>{line.trim()}</p>
                    );
                  })}
                </ul>
              ) : (
                <p className={`${isDark ? 'text-slate-300' : 'text-slate-700'} leading-relaxed text-sm font-medium`}>{section.content}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};



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
  } else if (modelLower.includes('liquid')) {
    return {
      name: 'Liquid LFM',
      logo: `${lobeBase}/liquid-color.png`,
      color: 'blue-500',
    };
  } else if (modelLower.includes('stepfun')) {
    return {
      name: 'StepFun',
      logo: `${lobeBase}/stepfun-color.png`,
      color: 'blue-400',
    };
  } else if (modelLower.includes('upstage')) {
    return {
      name: 'Solar Pro',
      logo: `${lobeBase}/upstage-color.png`,
      color: 'blue-300',
    };
  } else if (modelLower.includes('arcee')) {
    return {
      name: 'Arcee Trinity',
      logo: `${lobeBase}/arcee-color.png`,
      color: 'blue-200',
    };
  } else if (modelLower.includes('cognitivecomputations') || modelLower.includes('dolphin')) {
    return {
      name: 'Dolphin Mistral',
      logo: `${lobeBase}/mistral-color.png`,
      color: 'purple-500',
    };
  }

  const modelName = modelId.split('/').pop().split(':')[0].replace(/-/g, ' ');
  return {
    name: modelName,
    logo: '🤖',
    color: 'amber',
  };
}
