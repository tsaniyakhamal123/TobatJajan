
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RegisterPage from './pages/Register';
import LoginPage from './pages/Login';
import InsertPage from './pages/insert';
import Dashboard from './pages/dashboard';
import WelcomePage from './pages/WelcomePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/welcome" replace />} />
        <Route path="/register" element={<RegisterPage />} />
        {<Route path="/login" element={<LoginPage />} />}
        {<Route path="/insert" element={<InsertPage />} />}
        {<Route path="/dashboard" element={<Dashboard/>} />}
        { <Route path="/welcome" element={<WelcomePage />} /> }
      </Routes>
    </BrowserRouter>
  );
}

export default App;