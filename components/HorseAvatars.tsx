
import React from 'react';

// Common Props
type AvatarProps = {
  className?: string;
  expressionOverride?: "normal" | "tired" | "shocked" | "chill" | "cool" | "rolling_eyes";
};

// Colors - slightly more muted/paper-like
const C = {
  skin: "#E6B89C",
  skinShadow: "#C89578",
  hair: "#5D4037",
  white: "#FFFDF7",
  stroke: "#2C1810", // Dark brown/black for outlines
  accent: {
    red: "#FF6B6B",
    blue: "#4ECDC4",
    green: "#A8E6CF",
    gold: "#FFD93D",
    grey: "#CED4DA"
  }
};

// Reusable parts for the hand-drawn style
const Outline = ({ d, fill = C.skin, strokeWidth = 2.5 }: { d: string, fill?: string, strokeWidth?: number }) => (
  <path d={d} fill={fill} stroke={C.stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
);

const Stroke = ({ d, width = 2.5, color = C.stroke, opacity = 1 }: { d: string, width?: number, color?: string, opacity?: number }) => (
  <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" opacity={opacity} />
);

// Generic Eye Components
const EyeHollow = ({ x, y, r = 5 }: { x: number, y: number, r?: number }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill="white" stroke={C.stroke} strokeWidth="2" />
    <circle cx={x} cy={y} r="1" fill={C.stroke} /> 
  </g>
);

const EyeTired = ({ x, y }: { x: number, y: number }) => (
  <g>
    <path d={`M${x-5},${y} Q${x},${y-3} ${x+5},${y}`} fill="none" stroke={C.stroke} strokeWidth="2" />
    <circle cx={x} cy={y+2} r="1" fill={C.stroke} />
    {/* Bag */}
    <path d={`M${x-5},${y+4} Q${x},${y+8} ${x+5},${y+4}`} fill="none" stroke={C.stroke} strokeWidth="1" opacity="0.4" />
  </g>
);

const EyeSide = ({ x, y, dir = 'right' }: { x: number, y: number, dir?: 'left'|'right' }) => (
  <g>
    <circle cx={x} cy={y} r="5" fill="white" stroke={C.stroke} strokeWidth="2" />
    <circle cx={dir === 'right' ? x+2 : x-2} cy={y} r="2" fill={C.stroke} />
  </g>
);

const EyeRolling = ({ x, y }: { x: number, y: number }) => (
  <g>
    <circle cx={x} cy={y} r="6" fill="white" stroke={C.stroke} strokeWidth="2" />
    <circle cx={x} cy={y-3} r="2" fill={C.stroke} />
  </g>
);

// 1. 纯血牛马 (Workhorse)
// Hollow eyes, drooping mouth, "Urgent" sticker
const Horse1 = ({ className }: AvatarProps) => (
  <svg viewBox="0 0 100 100" className={`overflow-visible ${className}`} xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(0, 5)">
      {/* Ears */}
      <Outline d="M25,20 L20,5 L35,15" fill={C.skin} />
      <Outline d="M75,20 L80,5 L65,15" fill={C.skin} />
      {/* Head */}
      <Outline d="M20,30 Q15,80 50,85 Q85,80 80,30 Q80,10 50,10 Q20,10 20,30" fill={C.skin} />
      {/* Hair */}
      <Outline d="M45,8 Q48,20 50,25 Q52,20 55,8" fill={C.hair} />
      
      {/* Eyes - Hollow & Tired */}
      <EyeHollow x={35} y={40} />
      <EyeHollow x={65} y={40} />
      {/* Dark circles */}
      <Stroke d="M30,48 Q35,52 40,48" width={1.5} opacity={0.5} />
      <Stroke d="M60,48 Q65,52 70,48" width={1.5} opacity={0.5} />

      {/* Mouth - Drooping */}
      <Stroke d="M42,65 Q50,62 58,65" />

      {/* Urgent Sticker */}
      <rect x="35" y="15" width="30" height="12" fill={C.accent.red} stroke={C.stroke} strokeWidth="1.5" transform="rotate(-5 50 20)" />
      <path d="M40,18 L45,18 M50,18 L60,18" stroke="white" strokeWidth="2" transform="rotate(-5 50 20)" />
    </g>
  </svg>
);

// 2. 脆皮马 (Fragile)
// Cracks, Band-aid, Scared eyes
const Horse2 = ({ className }: AvatarProps) => (
  <svg viewBox="0 0 100 100" className={`overflow-visible ${className}`} xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(0, 5)">
       {/* Ears */}
       <Outline d="M25,20 L20,5 L35,15" fill="#FFE0E0" />
       <Outline d="M75,20 L80,5 L65,15" fill="#FFE0E0" />
       
       {/* Head - Slightly pale */}
       <Outline d="M20,30 Q15,80 50,85 Q85,80 80,30 Q80,10 50,10 Q20,10 20,30" fill="#FFE0E0" />
       
       {/* Eyes - Tiny pupils, big white (Scared) */}
       <circle cx="35" cy="40" r="6" fill="white" stroke={C.stroke} strokeWidth="2" />
       <circle cx="35" cy="40" r="1" fill={C.stroke} />
       <circle cx="65" cy="40" r="6" fill="white" stroke={C.stroke} strokeWidth="2" />
       <circle cx="65" cy="40" r="1" fill={C.stroke} />

       {/* Sweat */}
       <path d="M75,30 Q78,35 75,40 Q72,35 75,30" fill={C.accent.blue} stroke={C.stroke} strokeWidth="1" />

       {/* Crack */}
       <Stroke d="M25,55 L30,60 L28,65" width={1.5} />
       
       {/* Band-aid */}
       <rect x="55" y="55" width="15" height="6" fill="#FFCCBC" stroke={C.stroke} strokeWidth="1" transform="rotate(-15 62 58)" />
       
       {/* Mouth - Wobbly */}
       <Stroke d="M45,70 Q50,68 55,70" />
    </g>
  </svg>
);

// 3. 假装在跑马 (Pretend Run)
// Speed lines, focused eyes, but static
const Horse3 = ({ className }: AvatarProps) => (
  <svg viewBox="0 0 100 100" className={`overflow-visible ${className}`} xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(0, 5)">
       {/* Ears - Swept back */}
       <Outline d="M25,25 L15,15 L35,20" fill={C.skin} />
       <Outline d="M75,25 L85,15 L65,20" fill={C.skin} />
       
       {/* Head */}
       <Outline d="M20,30 Q15,80 50,85 Q85,80 80,30 Q80,10 50,10 Q20,10 20,30" fill={C.skin} />
       
       {/* Headband */}
       <path d="M22,25 Q50,20 78,25" fill="none" stroke={C.accent.red} strokeWidth="5" strokeLinecap="round" />
       
       {/* Eyes - Looking forward intense */}
       <EyeSide x={35} y={45} dir="right" />
       <EyeSide x={65} y={45} dir="right" />

       {/* Face Speed Lines */}
       <Stroke d="M10,40 L25,40" width={1.5} opacity={0.6} />
       <Stroke d="M12,50 L22,50" width={1.5} opacity={0.6} />
       
       {/* Mouth - Serious */}
       <Stroke d="M45,65 L55,65" />
    </g>
  </svg>
);

// 4. 被牵着走马 (Led)
// Rope, blank stare, leaning
const Horse4 = ({ className }: AvatarProps) => (
  <svg viewBox="0 0 100 100" className={`overflow-visible ${className}`} xmlns="http://www.w3.org/2000/svg">
    <g transform="rotate(5 50 50) translate(0, 5)">
       {/* Ears */}
       <Outline d="M25,20 L20,5 L35,15" fill="#D3D3D3" />
       <Outline d="M75,20 L80,5 L65,15" fill="#D3D3D3" />
       
       {/* Head */}
       <Outline d="M20,30 Q15,80 50,85 Q85,80 80,30 Q80,10 50,10 Q20,10 20,30" fill="#D3D3D3" />
       
       {/* Eyes - Dots (Blank) */}
       <circle cx="35" cy="40" r="2" fill={C.stroke} />
       <circle cx="65" cy="40" r="2" fill={C.stroke} />
       
       {/* Rope */}
       <path d="M50,75 Q80,65 95,50" fill="none" stroke={C.accent.red} strokeWidth="3" />
       <circle cx="50" cy="75" r="3" fill={C.accent.red} />

       {/* Mouth - Small line */}
       <Stroke d="M48,60 L52,60" width={1.5} />
    </g>
  </svg>
);

// 5. 想逃没草马 (No Grass)
// Looking away, sighing
const Horse5 = ({ className }: AvatarProps) => (
  <svg viewBox="0 0 100 100" className={`overflow-visible ${className}`} xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(0, 5)">
       {/* Head - Turned slightly */}
       <Outline d="M25,30 Q20,80 45,85 Q80,80 85,30 Q80,10 55,10 Q25,10 25,30" fill="#DEB887" />
       <Outline d="M30,20 L25,5 L40,15" fill="#DEB887" />
       <Outline d="M80,20 L85,5 L70,15" fill="#DEB887" />
       
       {/* Eyes - Looking up/away */}
       <EyeHollow x={40} y={40} />
       <g transform="translate(30,0)"> <EyeHollow x={40} y={40} /> </g>
       <circle cx={42} cy={38} r="2" fill={C.stroke} />
       <circle cx={72} cy={38} r="2" fill={C.stroke} />

       {/* Mouth - Sigh */}
       <Stroke d="M50,65 Q55,68 60,65" />
       <path d="M65,60 L70,55" stroke={C.stroke} strokeWidth="1.5" />

       {/* Thought Bubble - Far away grass */}
       <circle cx="85" cy="20" r="2" fill={C.accent.grey} opacity="0.5" />
       <circle cx="90" cy="15" r="3" fill={C.accent.grey} opacity="0.5" />
       <path d="M92,8 L95,2 L98,8" stroke={C.accent.green} strokeWidth="2" fill="none" />
    </g>
  </svg>
);

// 6. 躺平心虚马 (Lying Down)
// Rotated, eye peeking
const Horse6 = ({ className }: AvatarProps) => (
  <svg viewBox="0 0 100 100" className={`overflow-visible ${className}`} xmlns="http://www.w3.org/2000/svg">
     {/* Floor line */}
     <Stroke d="M0,85 L100,85" width={1} opacity={0.2} />
     
     <g transform="translate(10, 60) rotate(-90 40 40)">
       {/* Ears */}
       <Outline d="M25,20 L20,5 L35,15" fill={C.skin} />
       <Outline d="M75,20 L80,5 L65,15" fill={C.skin} />
       {/* Head */}
       <Outline d="M20,30 Q15,80 50,85 Q85,80 80,30 Q80,10 50,10 Q20,10 20,30" fill={C.skin} />
       
       {/* Eyes - Peeking (looking 'up' relative to head) */}
       <circle cx="35" cy="40" r="5" fill="white" stroke={C.stroke} strokeWidth="2" />
       <circle cx="38" cy="40" r="2" fill={C.stroke} />
       
       <circle cx="65" cy="40" r="5" fill="white" stroke={C.stroke} strokeWidth="2" />
       <circle cx="68" cy="40" r="2" fill={C.stroke} />

       {/* Mouth - Straight */}
       <Stroke d="M45,65 L55,65" />
       
       {/* Sweat Drop - Horizontal gravity */}
       <path d="M50,20 Q55,20 50,15" fill={C.accent.blue} stroke={C.stroke} strokeWidth="1" transform="rotate(90 50 20)" />
     </g>
  </svg>
);

// 7. 半退休马 (Semi-retired)
// Chill, tea cup
const Horse7 = ({ className }: AvatarProps) => (
  <svg viewBox="0 0 100 100" className={`overflow-visible ${className}`} xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(0, 5)">
       {/* Ears */}
       <Outline d="M25,20 L20,5 L35,15" fill="#F0E68C" />
       <Outline d="M75,20 L80,5 L65,15" fill="#F0E68C" />
       
       {/* Head */}
       <Outline d="M20,30 Q15,80 50,85 Q85,80 80,30 Q80,10 50,10 Q20,10 20,30" fill="#F0E68C" />
       
       {/* Eyes - Chill ^^ */}
       <path d="M30,40 L35,35 L40,40" fill="none" stroke={C.stroke} strokeWidth="2" strokeLinecap="round" />
       <path d="M60,40 L65,35 L70,40" fill="none" stroke={C.stroke} strokeWidth="2" strokeLinecap="round" />

       {/* Smile */}
       <Stroke d="M45,60 Q50,65 55,60" />

       {/* Tea Cup */}
       <path d="M70,70 L70,80 Q75,85 80,80 L80,70 Z" fill="white" stroke={C.stroke} strokeWidth="1.5" />
       <path d="M80,72 Q85,72 85,76 Q85,80 80,78" fill="none" stroke={C.stroke} strokeWidth="1.5" />
       {/* Steam */}
       <path d="M75,65 Q78,60 75,55" stroke="white" strokeWidth="2" opacity="0.6" />
    </g>
  </svg>
);

// 8. 已读不回马 (Ignored)
// Phone, straight mouth, notification
const Horse8 = ({ className }: AvatarProps) => (
  <svg viewBox="0 0 100 100" className={`overflow-visible ${className}`} xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(0, 5)">
       {/* Ears */}
       <Outline d="M25,20 L20,5 L35,15" fill="#B0C4DE" />
       <Outline d="M75,20 L80,5 L65,15" fill="#B0C4DE" />
       
       {/* Head */}
       <Outline d="M20,30 Q15,80 50,85 Q85,80 80,30 Q80,10 50,10 Q20,10 20,30" fill="#B0C4DE" />
       
       {/* Eyes - Looking down/at phone */}
       <circle cx="35" cy="40" r="5" fill="white" stroke={C.stroke} strokeWidth="2" />
       <circle cx="35" cy="43" r="2" fill={C.stroke} />
       <circle cx="65" cy="40" r="5" fill="white" stroke={C.stroke} strokeWidth="2" />
       <circle cx="65" cy="43" r="2" fill={C.stroke} />

       {/* Mouth - Flat line */}
       <Stroke d="M45,60 L55,60" />

       {/* Phone */}
       <rect x="60" y="65" width="20" height="25" rx="2" fill="#333" stroke={C.stroke} strokeWidth="1" transform="rotate(-10)" />
       {/* Notification Bubble */}
       <circle cx="80" cy="65" r="5" fill={C.accent.red} stroke="white" strokeWidth="1" />
       <text x="78" y="68" fontSize="8" fill="white" fontWeight="bold">1</text>
    </g>
  </svg>
);

// 9. AI 边缘马 (AI Edge)
// Half pixelated, confused
const Horse9 = ({ className }: AvatarProps) => (
  <svg viewBox="0 0 100 100" className={`overflow-visible ${className}`} xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(0, 5)">
       {/* Normal Half Left */}
       <path d="M20,30 Q15,80 50,85 L50,10 Q20,10 20,30" fill={C.skin} stroke={C.stroke} strokeWidth="2.5" />
       <path d="M25,20 L20,5 L35,15" fill={C.skin} stroke={C.stroke} strokeWidth="2.5" />
       <EyeHollow x={35} y={40} />
       
       {/* Pixel Half Right */}
       <path d="M50,85 L80,80 L85,30 L50,10 Z" fill="#A8E6CF" opacity="0.8" />
       {/* Pixel outlines */}
       <path d="M50,10 L60,10 L60,20 L70,20 L70,30 L80,30" fill="none" stroke={C.accent.green} strokeWidth="2" />
       
       {/* Pixel Eye */}
       <rect x="60" y="35" width="10" height="10" stroke={C.stroke} strokeWidth="2" fill="white" />
       <rect x="62" y="37" width="4" height="4" fill={C.stroke} />

       {/* Glitch marks */}
       <rect x="75" y="60" width="10" height="2" fill={C.accent.blue} />
       <rect x="80" y="55" width="5" height="2" fill={C.accent.red} />
       
       {/* Mouth */}
       <path d="M40,65 L50,65 L60,68" stroke={C.stroke} strokeWidth="2.5" fill="none" />
    </g>
  </svg>
);

// 10. 情绪外包马 (Emotion Outsourced)
// Loading face, blank
const Horse10 = ({ className }: AvatarProps) => (
  <svg viewBox="0 0 100 100" className={`overflow-visible ${className}`} xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(0, 5)">
       <Outline d="M25,20 L20,5 L35,15" fill={C.white} />
       <Outline d="M75,20 L80,5 L65,15" fill={C.white} />
       <Outline d="M20,30 Q15,80 50,85 Q85,80 80,30 Q80,10 50,10 Q20,10 20,30" fill={C.white} />
       
       {/* Eyes - Blank dots */}
       <circle cx="35" cy="40" r="2" fill={C.stroke} />
       <circle cx="65" cy="40" r="2" fill={C.stroke} />

       {/* Loading Spinner on forehead */}
       <g transform="translate(50, 25)">
          <path d="M0,-8 A8,8 0 0,1 8,0" fill="none" stroke={C.accent.blue} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M8,0 A8,8 0 0,1 0,8" fill="none" stroke={C.accent.blue} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
          <path d="M0,8 A8,8 0 0,1 -8,0" fill="none" stroke={C.accent.blue} strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
       </g>

       {/* Mouth - Straight line */}
       <Stroke d="M40,65 L60,65" />
       
       {/* "Processing" text implied */}
       <circle cx="50" cy="65" r="15" stroke={C.stroke} strokeWidth="1" strokeDasharray="2 2" fill="none" opacity="0.2" />
    </g>
  </svg>
);

// 11. 天生拽马 (Cool Horse)
// Shades, smirk
const Horse11 = ({ className, expressionOverride }: AvatarProps) => {
  // Override allows landing page rolling eyes
  const isRolling = expressionOverride === 'rolling_eyes';
  
  return (
  <svg viewBox="0 0 100 100" className={`overflow-visible ${className}`} xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(0, 5)">
       {/* Mohawk Hair */}
       <path d="M45,5 L40,-10 L50,-5 L60,-15 L65,5" fill={C.accent.red} stroke={C.stroke} strokeWidth="2" />

       <Outline d="M25,20 L20,5 L35,15" fill="#333" />
       <Outline d="M75,20 L80,5 L65,15" fill="#333" />
       <Outline d="M20,30 Q15,80 50,85 Q85,80 80,30 Q80,10 50,10 Q20,10 20,30" fill="#333" />
       
       {isRolling ? (
         <g>
           <EyeRolling x={35} y={40} />
           <EyeRolling x={65} y={40} />
         </g>
       ) : (
         /* Sunglasses */
         <g>
           <path d="M25,35 L75,35 L75,48 Q75,55 65,55 L35,55 Q25,55 25,48 Z" fill="black" stroke="white" strokeWidth="1" />
           <path d="M30,38 L40,38" stroke="white" strokeWidth="1" opacity="0.5" />
         </g>
       )}

       {/* Smirk */}
       <Stroke d="M45,70 Q55,75 65,65" color="white" />
    </g>
  </svg>
)};

// Main Component to Switch
export const HorseAvatar = ({ id, className = "", expressionOverride }: { id: string, className?: string, expressionOverride?: "normal" | "tired" | "shocked" | "chill" | "cool" | "rolling_eyes" }) => {
  const props = { className, expressionOverride };
  switch (id) {
    case '1': return <Horse1 {...props} />;
    case '2': return <Horse2 {...props} />;
    case '3': return <Horse3 {...props} />;
    case '4': return <Horse4 {...props} />;
    case '5': return <Horse5 {...props} />;
    case '6': return <Horse6 {...props} />;
    case '7': return <Horse7 {...props} />;
    case '8': return <Horse8 {...props} />;
    case '9': return <Horse9 {...props} />;
    case '10': return <Horse10 {...props} />;
    case '11': return <Horse11 {...props} />;
    default: return <Horse1 {...props} />;
  }
};
