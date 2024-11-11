import React from 'react';

const timePeriods = [
  { value: '5d', label: '5 Days' },
  { value: '1mo', label: '1 Month' },
  { value: '3mo', label: '3 Months' },
  { value: '1y', label: '1 Year' },
  { value: '5y', label: '5 Years' },
  { value: '10y', label: '10 Years' },
  { value: 'ytd', label: 'Year-To-Date' },
  { value: 'max', label: 'Max' },
];

function TimePeriodSelector({ selectedPeriod, onSelectPeriod }) {
  return (
    <div className="flex justify-center p-4">
      <div className="flex flex-wrap gap-2">
        {timePeriods.map((period) => (
          <button
            key={period.value}
            onClick={() => onSelectPeriod(period.value)}
            className={`px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
              ${
                selectedPeriod === period.value
                  ? 'bg-blue-500 text-white dark:bg-blue-600'
                  : 'bg-gray-700 text-white dark:bg-gray-800 hover:bg-gray-600 dark:hover:bg-gray-700'
              }
            `}
          >
            {period.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default TimePeriodSelector;