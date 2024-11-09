// src/components/StockSummary.js

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const formatMarketCap = (value) => {
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  } else if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  } else {
    return `$${value.toLocaleString()}`;
  }
};

const StockSummary = () => {
  const { ticker } = useParams();
  const [stockData, setStockData] = useState(null);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('1mo');
  const [historicalData, setHistoricalData] = useState(null);

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        const response = await axiosInstance.get(`/search/${ticker}/`, {
          params: { period: selectedPeriod },
        });
        if (response.data.stockDetails.valid) {
          setStockData(response.data.stockDetails);
          setHistoricalData(response.data.historicalData);
          setError('');
        } else {
          setError(response.data.message || 'Invalid ticker symbol.');
        }
      } catch (err) {
        console.error('Error fetching stock data:', err);
        setError('Failed to fetch stock data.');
      }
    };

    if (ticker) {
      fetchStockData();
    }
  }, [ticker, selectedPeriod]);

  const handlePeriodChange = (e) => {
    setSelectedPeriod(e.target.value);
  };

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-20 p-6 bg-white dark:bg-gray-800 shadow-md rounded">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Error</h2>
        <p className="text-gray-700 dark:text-gray-300">{error}</p>
      </div>
    );
  }

  if (!stockData || !historicalData) {
    return (
      <div className="max-w-2xl mx-auto mt-20 p-6 bg-white dark:bg-gray-800 shadow-md rounded">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Loading...</h2>
      </div>
    );
  }

  const chartData = {
    labels: historicalData.dates,
    datasets: [
      {
        label: 'Closing Price',
        data: historicalData.close,
        fill: false,
        backgroundColor: 'rgba(59, 130, 246, 0.5)', // Blue-500 with opacity
        borderColor: 'rgba(59, 130, 246, 1)', // Blue-500
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#ffffff', // White text for dark mode
        },
      },
      title: {
        display: true,
        text: `${stockData.companyName} (${stockData.ticker}) Closing Prices`,
        color: '#ffffff',
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#ffffff',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      y: {
        ticks: {
          color: '#ffffff',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
  };

  return (
    <div className="max-w-4xl mx-auto mt-20 p-6 bg-white dark:bg-gray-800 shadow-md rounded">
      <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        {stockData.companyName} ({stockData.ticker})
      </h2>
      <div className="mb-4">
        <span className="text-lg text-gray-700 dark:text-gray-300">Current Price: </span>
        <span className="text-lg font-semibold text-gray-900 dark:text-white">
          ${stockData.currentPrice}
        </span>
      </div>
      <div className="mb-6">
        <span className="text-lg text-gray-700 dark:text-gray-300">Market Cap: </span>
        <span className="text-lg font-semibold text-gray-900 dark:text-white">
          {formatMarketCap(stockData.marketCap)}
        </span>
      </div>

      {/* Add more stock details as needed */}
      
      {/* Time Period Selection */}
      <div className="mb-4">
        <label htmlFor="period" className="mr-2 text-gray-700 dark:text-gray-300">Select Time Period:</label>
        <select
          id="period"
          value={selectedPeriod}
          onChange={handlePeriodChange}
          className="px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
        >
          <option value="1d">1 Day</option>
          <option value="5d">5 Days</option>
          <option value="1mo">1 Month</option>
          <option value="3mo">3 Months</option>
          <option value="6mo">6 Months</option>
          <option value="1y">1 Year</option>
          <option value="2y">2 Years</option>
          <option value="5y">5 Years</option>
          <option value="10y">10 Years</option>
          <option value="ytd">Year-To-Date</option>
          <option value="max">Max</option>
        </select>
      </div>
      
      {/* Stock Price Chart */}
      <div>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default StockSummary;