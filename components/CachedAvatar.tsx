import { useState } from 'react';
import { Image, Platform } from 'react-native';
import { Avatar } from 'react-native-paper';

interface CachedAvatarProps {
  size?: number;
  source?: { uri: string } | null;
  label?: string;
  style?: any;
  onError?: () => void;
  fallbackBackgroundColor?: string;
}

export default function CachedAvatar({
  size = 60,
  source,
  label,
  style,
  onError,
  fallbackBackgroundColor = 'rgba(255,255,255,0.2)',
}: CachedAvatarProps) {
  const [imageError, setImageError] = useState(false);

  // 如果没有图片源或图片加载失败，显示文字头像
  if (!source?.uri || imageError) {
    return (
      <Avatar.Text
        size={size}
        label={label || 'U'}
        style={[style, { backgroundColor: fallbackBackgroundColor }]}
      />
    );
  }

  // Web平台使用简化的实现
  if (Platform.OS === 'web') {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          backgroundColor: fallbackBackgroundColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <img
          src={source.uri}
          alt="Avatar"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%',
          }}
          onError={() => {
            console.log('❌ Web头像加载失败，回退到文字头像');
            onError?.();
          }}
        />
      </div>
    );
  }

  // React Native平台使用Image
  return (
    <Image
      source={source}
      style={[
        style,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
        }
      ]}
      resizeMode="cover"
      onError={() => {
        console.log('❌ React Native头像加载失败，回退到文字头像');
        setImageError(true);
        onError?.();
      }}
    />
  );
}
