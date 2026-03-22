// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Analyst from './pages/Analyst';
import DCA from './pages/DCA';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/analyst" element={<Analyst />} />
        <Route path="/dca" element={<DCA />} />
      </Routes>
    </Layout>
  );
}