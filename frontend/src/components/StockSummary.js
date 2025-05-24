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
  const [currentHoldings, setCurrentHoldings] = useState(0);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('1mo');
  const [historicalData, setHistoricalData] = useState(null); 
  const { updateCash } = useAuth();
  const [showError, setShowError] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

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
          setCurrentHoldings(response.data.currentHoldings);
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
      const intervalId = setInterval(fetchStockData, 30000); // Poll every 5 seconds
      return () => clearInterval(intervalId);
    }
  }, [ticker, selectedPeriod]);

  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer1 = setTimeout(() => {
        setShowError(false);
      }, 4500);
  
      const timer2 = setTimeout(() => {
        setError('');
      }, 5000);
  
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [error]);
  
  useEffect(() => {
    if (message) {
      setShowMessage(true);
      const timer1 = setTimeout(() => {
        setShowMessage(false);
      }, 4500);
  
      const timer2 = setTimeout(() => {
        setMessage('');
      }, 5000);
  
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [message]);

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
      setCurrentHoldings((prevHoldings) => prevHoldings + parseFloat(buyQuantity));
      setBuyQuantity('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to buy stock.');
    }
  };

  const handleSell = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (!sellQuantity || isNaN(sellQuantity) || parseFloat(sellQuantity) <= 0) {
      setError('Please enter a valid quantity to sell.');
      return;
    }

    if (parseFloat(sellQuantity) > currentHoldings){
      setError('You do not have enough shares to sell.');
      return;
    }

    try {
      const response = await axiosInstance.post(`/sell-stock/${ticker}/`, {
        quantity: sellQuantity,
      });
      setMessage(response.data.message);
      updateCash(response.data.cash_total);
      setCurrentHoldings((prevHoldings) => prevHoldings - parseFloat(sellQuantity));
      setSellQuantity('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to sell stock.');
    }
  };

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
      {/* Error Message */}
      {error && (
        <div
          className={`mb-4 p-4 bg-red-100 text-red-700 rounded transition-opacity duration-500 ${
            showError ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {error}
        </div>
      )}

      {/* Success Message */}
      {message && (
        <div
          className={`mb-4 p-4 bg-green-100 text-green-700 rounded transition-opacity duration-500 ${
            showMessage ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {message}
        </div>
      )}

      {/* Flex Container for Company Info and Forms */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-6">
        {/* Left Section: Company Information */}
        <div className="md:w-2/3">
          <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
            {stockData.companyName} ({stockData.ticker})
          </h2>
          <div className="mb-3">
            <span className="text-lg text-gray-700 dark:text-gray-300">Current Price: </span>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatNum(stockData.currentPrice)}
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
        </div>

        <div className="md:w-7/10 mt-10 md:mt-8">
          <div className="mb-10">
            <form onSubmit={handleBuy} className="flex items-center">
              <label htmlFor="buyQuantity" className="sr-only">Buy Quantity</label>
              <input
                id="buyQuantity"
                type="number"
                step="0.001"
                min="0"
                value={buyQuantity}
                onChange={(e) => setBuyQuantity(e.target.value)}
                placeholder="Quantity"
                className="border p-2 mr-4 rounded-md w-24 text-black placeholder-black"
                required
              />
              <button
                type="submit"
                className="bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 transition-opacity duration-300"
              >
                Buy
              </button>
            </form>
          </div>

          {/* Sell Stock Form */}
          <div className="mb-4">
            <form onSubmit={handleSell} className="flex items-center">
              <label htmlFor="sellQuantity" className="sr-only">Sell Quantity</label>
              <input
                id="sellQuantity"
                type="number"
                step="0.001"
                min="0"
                max={currentHoldings}
                value={sellQuantity}
                onChange={(e) => setSellQuantity(e.target.value)}
                placeholder="Quantity"
                className="border p-2 mr-4 rounded-md w-24 text-black placeholder-black"
                required
              />
              <button
                type="submit"
                className="bg-red-700 text-white px-4 py-2 rounded-md hover:bg-red-800 transition-opacity duration-300"
              >
                Sell
              </button>
            </form>
          </div>
          
          {/* Current Holdings */}
          <div className="mb-6">
            <p className="text-lg">
              <strong>Shares Owned:</strong> {currentHoldings}
            </p>
          </div>
        </div>
      </div>

      {/* Historical Data Chart */}
      {historicalData && (
        <div>
          <Line data={chartData} options={options} />
        </div>
      )}

      {/* Time Period Selector */}
      <div className="p-4">
        <TimePeriodSelector selectedPeriod={selectedPeriod} onSelectPeriod={handlePeriodChange} />
      </div>
    </div>
  );
};

export default StockSummary;