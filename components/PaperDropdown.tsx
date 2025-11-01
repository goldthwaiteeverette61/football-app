import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Menu, TextInput, useTheme } from 'react-native-paper';

interface DropdownOption {
  key: string;
  label: string;
}

interface PaperDropdownProps {
  options: DropdownOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  style?: any;
  disabled?: boolean;
  label?: string;
}

export default function PaperDropdown({
  options,
  selectedValue,
  onSelect,
  placeholder = '请选择',
  style,
  disabled = false,
  label,
}: PaperDropdownProps) {
  const theme = useTheme();
  const [showDropDown, setShowDropDown] = useState(false);

  // 获取当前选中的标签
  const getSelectedLabel = () => {
    return options?.find(option => option.key === selectedValue)?.label || placeholder;
  };

  const handleValueChange = (value: string) => {
    onSelect(value);
    setShowDropDown(false);
  };

  // 统一使用react-native-paper的Menu组件
  return (
    <View style={[styles.container, style]}>
      <Menu
        visible={showDropDown}
        onDismiss={() => setShowDropDown(false)}
        anchor={
          <TextInput
            mode="outlined"
            value={getSelectedLabel()}
            placeholder={placeholder}
            style={styles.input}
            contentStyle={styles.inputContent}
            editable={false}
            right={
              <TextInput.Icon 
                icon={showDropDown ? "chevron-up" : "chevron-down"}
                onPress={() => !disabled && setShowDropDown(!showDropDown)}
              />
            }
            onPressIn={() => !disabled && setShowDropDown(!showDropDown)}
          />
        }
      >
        {options?.map((option) => (
          <Menu.Item
            key={option.key}
            onPress={() => handleValueChange(option.key)}
            title={option.label}
            titleStyle={[
              styles.menuItemText,
              selectedValue === option.key && { color: theme.colors.primary }
            ]}
          />
        ))}
      </Menu>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 120,
    maxWidth: 160,
  },
  input: {
    backgroundColor: 'transparent',
    textAlign: 'center',
    height: 40,
  },
  inputContent: {
    textAlign: 'center',
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '400',
  },
});
