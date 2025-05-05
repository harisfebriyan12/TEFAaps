import React from 'react';
import { Platform } from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';

interface DateTimePickerProps {
  value: Date;
  mode: 'date' | 'time' | 'datetime';
  display?: 'default' | 'spinner' | 'calendar' | 'clock';
  onChange: (event: any, date?: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
}

// This is a wrapper component to handle platform differences
const DateTimePicker = (props: DateTimePickerProps) => {
  if (Platform.OS === 'web') {
    // For web, use the native input
    return (
      <input
        type={props.mode === 'date' ? 'date' : 'time'}
        value={formatDateForInput(props.value, props.mode)}
        onChange={(e) => {
          const date = new Date(e.target.value);
          props.onChange({ type: 'set' }, date);
        }}
        min={props.minimumDate ? formatDateForInput(props.minimumDate, props.mode) : undefined}
        max={props.maximumDate ? formatDateForInput(props.maximumDate, props.mode) : undefined}
        style={{
          fontSize: '16px',
          padding: '8px',
          borderRadius: '8px',
          border: '1px solid #E5E7EB',
          marginBottom: '16px',
          width: '100%',
        }}
      />
    );
  }
  
  // For native platforms, use RNDateTimePicker
  return <RNDateTimePicker {...props} />;
};

const formatDateForInput = (date: Date, mode: 'date' | 'time' | 'datetime'): string => {
  if (mode === 'date') {
    return date.toISOString().split('T')[0];
  } else if (mode === 'time') {
    return date.toTimeString().slice(0, 5);
  }
  return date.toISOString();
};

export default DateTimePicker;