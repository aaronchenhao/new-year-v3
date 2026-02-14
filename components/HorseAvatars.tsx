import React from 'react';

// Main Component to Switch
export const HorseAvatar = ({ id, className = "", expressionOverride }: { id: string, className?: string, expressionOverride?: "normal" | "tired" | "shocked" | "chill" | "cool" | "rolling_eyes" }) => {
  // 图片加载错误处理
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // 可以在这里添加fallback逻辑，比如显示默认图片或SVG
    console.warn(`Failed to load horse avatar ${id}:`, e);
  };

  // 构建图片路径
  const imagePath = `/horse-avatars/${id}.png`;

  return (
    <div className={`${className}`} style={{ 
      display: 'inline-block', 
      overflow: 'hidden'
    }}>
      <img
        src={imagePath}
        alt={`Horse ${id}`}
        onError={handleImageError}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          // 确保图片居中填充容器且不超出边界
        }}
      />
    </div>
  );
};