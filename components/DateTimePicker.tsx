import React from 'react';
import { View, Text, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Props {
  value: Date;
  mode: 'date' | 'time';
  display?: 'default' | 'spinner' | 'calendar' | 'clock';
  onChange: (event: any, selectedDate?: Date) => void;
}

const MyDateTimePicker: React.FC<Props> = ({ value, mode, display = 'default', onChange }) => {
  return (
    <View>
      {Platform.OS === 'ios' ? (
        <DateTimePicker
          value={value}
          mode={mode}
          display={display}
          onChange={onChange}
          style={{ width: '100%' }}
        />
      ) : (
        <DateTimePicker
          value={value}
          mode={mode}
          display={display}
          onChange={onChange}
        />
      )}
    </View>
  );
};

export default MyDateTimePicker;
