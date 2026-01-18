import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import Dashboard from './Dashboard';
import QuizGenerator from './QuizGenerator';
import QuizPlayer from './QuizPlayer';
import QuizAssessment from './QuizAssessment'; 
import QuizViewer from './QuizViewer';
import ResultViewer from './ResultViewer';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/generate" element={<QuizGenerator />} />
        <Route path="/assess" element={<QuizAssessment />} />
        <Route path="/play/:code" element={<QuizPlayer />} />
        <Route path="*" element={<Navigate to="/" />} />
        <Route path="/view/:code" element={<QuizViewer />} />
        <Route path="/result/:id" element={<ResultViewer />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;