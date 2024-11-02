import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import axiosInstance from '../utils/axiosInstance'; // Assuming you have this set up

const Navbar = () => {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={styles.navbar}>
      <h2 style={styles.logo}>MyApp</h2>
      <div>
        {!auth.isAuthenticated && (
          <>
            <Link to="/login" style={styles.link}>Login</Link>
            <Link to="/register" style={styles.link}>Register</Link>
          </>
        )}
        {auth.isAuthenticated && (
          <>
            <Link to="/" style={styles.link}>Welcome</Link>
            <button onClick={handleLogout} style={styles.button}>Sign Out</button>
          </>
        )}
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    padding: '10px 20px',
    backgroundColor: '#333',
    color: '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    margin: 0,
  },
  link: {
    marginRight: '15px',
    color: '#fff',
    textDecoration: 'none',
  },
  button: {
    padding: '5px 10px',
    backgroundColor: '#555',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
  },
};

export default Navbar;