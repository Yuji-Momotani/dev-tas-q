import React from 'react';

interface TimeSelectorProps {
  value: string;
  onChange: (time: string) => void;
  disabled?: boolean;
}

export const TimeSelector: React.FC<TimeSelectorProps> = ({ value, onChange, disabled = false }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = ['00', '30'];

  const currentHour = value ? parseInt(value.split(':')[0]) : 0;
  const currentMinute = value ? value.split(':')[1] : '00';

  const handleHourChange = (hour: string) => {
    onChange(`${hour.padStart(2, '0')}:${currentMinute}`);
  };

  const handleMinuteChange = (minute: string) => {
    onChange(`${String(currentHour).padStart(2, '0')}:${minute}`);
  };

  return (
    <div className="flex space-x-2">
      <select
        value={currentHour}
        onChange={(e) => handleHourChange(e.target.value)}
        disabled={disabled}
        className="px-3 py-2 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
      >
        {hours.map((hour) => (
          <option key={hour} value={hour}>
            {String(hour).padStart(2, '0')}
          </option>
        ))}
      </select>
      <span className="self-center text-lg font-semibold">:</span>
      <select
        value={currentMinute}
        onChange={(e) => handleMinuteChange(e.target.value)}
        disabled={disabled}
        className="px-3 py-2 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
      >
        {minutes.map((minute) => (
          <option key={minute} value={minute}>
            {minute}
          </option>
        ))}
      </select>
    </div>
  );
};