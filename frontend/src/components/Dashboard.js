// src/components/Dashboard.js

import axios from 'axios';
import React, { useEffect, useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { format, parseISO } from 'date-fns';

const Dashboard = () => {
  const [portfolioHistory, setPortfolioHistory] = useState([]);
  const [currentHoldings, setCurrentHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/dashboard', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        setPortfolioHistory(response.data.portfolio_history);
        setCurrentHoldings(response.data.current_holdings);
        setLoading(false);
      } catch (err) {
        console.error(err); // Log the actual error for debugging
        setError('Failed to load dashboard.');
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // Calculate current portfolio value and percentage change
  const { currentValue, percentageChange } = useMemo(() => {
    if (portfolioHistory.length === 0) {
      return { currentValue: 0, percentageChange: 0 };
    }

    const sortedHistory = [...portfolioHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
    const latest = sortedHistory[sortedHistory.length - 1];
    const previous = sortedHistory.length > 1 ? sortedHistory[sortedHistory.length - 2] : null;

    const currentVal = Number(latest.total_value);
    const previousVal = previous ? Number(previous.total_value) : 0;

    const change = previousVal !== 0 ? ((currentVal - previousVal) / previousVal) * 100 : 0;

    return { currentValue: currentVal, percentageChange: change };
  }, [portfolioHistory]);

  // Prepare data for the chart
  const chartData = useMemo(() => ({
    labels: portfolioHistory.map(entry => format(parseISO(entry.date), 'MMM dd')),
    datasets: [
      {
        label: 'Total Account Value',
        data: portfolioHistory.map(entry => Number(entry.total_value)),
        fill: true,
        backgroundColor: 'rgba(75,192,192,0.2)',
        borderColor: 'rgba(75,192,192,1)',
        tension: 0.4, // Smooth curves
      },
    ],
  }), [portfolioHistory]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#FFFFFF', // Adjust based on your theme
        },
      },
      title: {
        display: true,
        text: 'Account Valuation Over Time',
        color: '#FFFFFF',
        font: {
          size: 18,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#FFFFFF',
          maxRotation: 45,
          minRotation: 45,
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      y: {
        ticks: {
          color: '#FFFFFF',
          callback: function(value) {
            return '$' + value.toLocaleString();
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-xl text-gray-700 dark:text-gray-200">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-red-100 dark:bg-red-900">
        <div className="text-xl text-red-700 dark:text-red-200">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white dark:bg-gray-800 shadow-md rounded mt-14">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Current Portfolio Value</h2>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center">
          <span className={`text-lg font-semibold ${percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {percentageChange >= 0 ? '▲' : '▼'} {percentageChange.toFixed(2)}%
          </span>
          <span className="ml-2 text-gray-600 dark:text-gray-300">from previous day</span>
        </div>
      </div>

      {/* Portfolio History Chart */}
      <div className="mb-10 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow">
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* Current Holdings Table */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Current Holdings</h2>
        {currentHoldings.length === 0 ? (
          <div className="text-center text-gray-500">No holdings available.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-700">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b-2 border-gray-200 dark:border-gray-600 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Ticker
                  </th>
                  <th className="py-2 px-4 border-b-2 border-gray-200 dark:border-gray-600 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Company Name
                  </th>
                  <th className="py-2 px-4 border-b-2 border-gray-200 dark:border-gray-600 text-right text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Quantity
                  </th>
                  <th className="py-2 px-4 border-b-2 border-gray-200 dark:border-gray-600 text-right text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Average Price
                  </th>
                  <th className="py-2 px-4 border-b-2 border-gray-200 dark:border-gray-600 text-right text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Current Price
                  </th>
                  <th className="py-2 px-4 border-b-2 border-gray-200 dark:border-gray-600 text-right text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Total Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentHoldings.map((holding, index) => (
                  <tr key={index} className="hover:bg-gray-100 dark:hover:bg-gray-600">
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200">
                      {holding.ticker.ticker}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200">
                      {holding.company_name}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-right text-gray-700 dark:text-gray-200">
                      {Number(holding.shares_owned).toLocaleString()}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-right text-gray-700 dark:text-gray-200">
                      ${Number(holding.average_price).toFixed(2)}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-right text-gray-700 dark:text-gray-200">
                      ${Number(holding.current_price).toFixed(2)}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-right text-gray-700 dark:text-gray-200">
                      ${Number(holding.total_value).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;