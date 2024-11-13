import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { Line } from 'react-chartjs-2';
import TimePeriodSelector from './TimePeriodSelector.js';
import useAuth from '../hooks/useAuth';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Decimation,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Decimation
);

const formatNum = (value) => {
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  } else if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  } else if (value === "--"){
    return `${value.toLocaleString()}`;
  } else {
    return `$${value.toLocaleString()}`;
  }
};

const StockSummary = () => {
  const { ticker } = useParams();
  const [stockData, setStockData] = useState(null);
  const [buyQuantity, setBuyQuantity] = useState('');
  const [sellQuantity, setSellQuantity] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('1mo');
  const [historicalData, setHistoricalData] = useState(null);
  const { auth, updateCash } = useAuth();

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
    setSelectedPeriod(e);
  };

  const handleBuy = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (!buyQuantity || isNaN(buyQuantity) || Number(buyQuantity) <= 0) {
      setError('Please enter a valid quantity to buy.');
      return;
    }

    try {
      const response = await axiosInstance.post(`/buy-stock/${ticker}/`, {
        quantity: buyQuantity,
      });
      setMessage(response.data.message);
      updateCash(response.data.cash_remaining);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to buy stock.');
    }
  };

  const handleSell = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (!sellQuantity || isNaN(sellQuantity) || Number(sellQuantity) <= 0) {
      setError('Please enter a valid quantity to sell.');
      return;
    }

    try {
      const response = await axiosInstance.post(`/sell-stock/${ticker}/`, {
        quantity: sellQuantity,
      });
      setMessage(response.data.message);
      updateCash(response.data.cash_total);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to sell stock.');
    }
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
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.1,
      },
    ],
  };
  
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#ffffff',
        },
      },
      title: {
        display: true,
        text: `${stockData.companyName} (${stockData.ticker}) Closing Prices`,
        color: '#ffffff',
      },
      decimation: {
        enabled: true,
        algorithm: 'lttb',
        samples: 100,
      },
    },
    interaction: {
      mode: 'nearest',
      intersect: false,
    },
    scales: {
      x: {
        ticks: {
          color: '#ffffff',
          maxRotation: 0,
          minRotation: 0,
          maxTicksLimit: 10,
          autoSkip: true,
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
      <div className="mb-3">
        <span className="text-lg text-gray-700 dark:text-gray-300">Current Price: </span>
        <span className="text-lg font-semibold text-gray-900 dark:text-white">
          ${stockData.currentPrice}
        </span>
      </div>
      <div className="mb-3">
        <span className="text-lg text-gray-700 dark:text-gray-300">Market Cap: </span>
        <span className="text-lg font-semibold text-gray-900 dark:text-white">
          {formatNum(stockData.marketCap)}
        </span>
      </div>
      <div className="mb-3">
        <span className="text-lg text-gray-700 dark:text-gray-300">Volume: </span>
        <span className="text-lg font-semibold text-gray-900 dark:text-white">
          {formatNum(stockData.volume)}
        </span>
      </div>  
      
      {/* Buy Stock Form */}
      <div className="mb-6">
        <h3 className="text-2xl font-semibold mb-2">Buy Stock</h3>
        <form onSubmit={handleBuy} className="flex items-center">
          <input
            type="number"
            step="0.0001"
            min="0"
            value={buyQuantity}
            onChange={(e) => setBuyQuantity(e.target.value)}
            placeholder="Quantity"
            className="border p-2 mr-4 rounded-md w-32"
            required
          />
          <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
            Buy
          </button>
        </form>
      </div>

      {/* Sell Stock Form */}
      <div className="mb-6">
        <h3 className="text-2xl font-semibold mb-2">Sell Stock</h3>
        <form onSubmit={handleSell} className="flex items-center">
          <input
            type="number"
            step="0.0001"
            min="0"
            value={sellQuantity}
            onChange={(e) => setSellQuantity(e.target.value)}
            placeholder="Quantity"
            className="border p-2 mr-4 rounded-md w-32"
            required
          />
          <button type="submit" className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">
            Sell
          </button>
        </form>
      </div>

      {/* Success or Error Message */}
      {message && <div className="text-green-500 mb-4">{message}</div>}
      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div>
        <Line data={chartData} options={options} />
      </div>
      <div className="p-4">
        <TimePeriodSelector selectedPeriod={selectedPeriod} onSelectPeriod={handlePeriodChange} />
      </div>
    </div>
  );
};

export default StockSummary;