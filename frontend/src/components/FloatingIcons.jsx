import React from 'react';
import { 
  DollarSign, 
  Euro, 
  PoundSterling, 
  Bitcoin, 
  Coins, 
  Wallet, 
  TrendingUp, 
  Gem,
  CircleDollarSign
} from 'lucide-react';

const FloatingIcons = ({ isDark }) => {
  const icons = [
    { Icon: DollarSign, top: '10%', left: '5%', size: 40, delay: '0s', duration: '15s' },
    { Icon: Euro, top: '25%', left: '85%', size: 32, delay: '2s', duration: '18s' },
    { Icon: PoundSterling, top: '65%', left: '10%', size: 48, delay: '4s', duration: '20s' },
    { Icon: Bitcoin, top: '80%', left: '80%', size: 36, delay: '1s', duration: '16s' },
    { Icon: Coins, top: '45%', left: '15%', size: 28, delay: '5s', duration: '14s' },
    { Icon: Wallet, top: '15%', left: '75%', size: 44, delay: '3s', duration: '22s' },
    { Icon: TrendingUp, top: '75%', left: '25%', size: 30, delay: '6s', duration: '17s' },
    { Icon: Gem, top: '35%', left: '90%', size: 24, delay: '2.5s', duration: '19s' },
    { Icon: CircleDollarSign, top: '55%', left: '92%', size: 42, delay: '1.5s', duration: '21s' },
    { Icon: DollarSign, top: '85%', left: '45%', size: 34, delay: '7s', duration: '15s' },
    { Icon: Euro, top: '5%', left: '40%', size: 26, delay: '0.5s', duration: '16s' },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px) rotate(0deg); opacity: 0; }
            10% { opacity: 0.1; }
            90% { opacity: 0.1; }
            100% { transform: translateY(-100px) rotate(360deg); opacity: 0; }
          }
        `}
      </style>
      {icons.map((item, idx) => (
        <div
          key={idx}
          className="absolute"
          style={{
            top: item.top,
            left: item.left,
            animation: `float ${item.duration} infinite ease-in-out ${item.delay}`,
            opacity: 0,
          }}
        >
          <item.Icon 
            size={item.size} 
            className={isDark ? 'text-amber-500/40' : 'text-amber-600/20'} 
            strokeWidth={1.5}
          />
        </div>
      ))}
    </div>
  );
};

export default FloatingIcons;
