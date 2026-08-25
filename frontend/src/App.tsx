import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { UploadPage } from './pages/UploadPage';
import { Dashboard } from './pages/Dashboard';
import { Persons } from './pages/Persons';
import { LunchControl } from './pages/LunchControl';
import { Details } from './pages/Details';

const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="app-container">
          <Sidebar />
          <div className="main-content">
            <Routes>
              <Route path="/" element={<UploadPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/persons" element={<Persons />} />
              <Route path="/lunch" element={<LunchControl />} />
              <Route path="/details" element={<Details />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
