// src/App.js

import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import Welcome from './components/Welcome';
import VerifyEmail from './components/VerifyEmail';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';
import Navbar from './components/Navbar';
import StockSummary from './components/StockSummary';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/verify/:uidb64/:token/"
          element={<VerifyEmail />}
        />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Welcome />
            </PrivateRoute>
          }
        />
        <Route
          path="/stock/:ticker/"
          element={
            <PrivateRoute>
              <StockSummary />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;