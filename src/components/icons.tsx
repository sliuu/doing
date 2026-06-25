import { View } from 'react-native';

const TEETH = 8;

export function GearIcon({ size = 18, color }: { size?: number; color: string }) {
  const ringSize = size * 0.6;
  const strokeWidth = Math.max(2, size * 0.14);
  const toothLength = size * 0.24;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {Array.from({ length: TEETH }).map((_, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            top: size / 2 - toothLength / 2,
            left: size / 2 - strokeWidth / 2,
            width: strokeWidth,
            height: toothLength,
            borderRadius: strokeWidth / 2,
            backgroundColor: color,
            transform: [{ rotate: `${(360 / TEETH) * i}deg` }, { translateY: -ringSize / 2 }],
          }}
        />
      ))}
      <View
        style={{
          width: ringSize,
          height: ringSize,
          borderRadius: ringSize / 2,
          borderWidth: strokeWidth,
          borderColor: color,
        }}
      />
    </View>
  );
}

export function UserIcon({ size = 18, color }: { size?: number; color: string }) {
  const headSize = size * 0.4;
  const bodyWidth = size * 0.76;
  const bodyHeight = size * 0.4;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden' }}>
      <View style={{ width: headSize, height: headSize, borderRadius: headSize / 2, backgroundColor: color, marginBottom: size * 0.05 }} />
      <View
        style={{
          width: bodyWidth,
          height: bodyHeight,
          borderTopLeftRadius: bodyWidth / 2,
          borderTopRightRadius: bodyWidth / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
}
