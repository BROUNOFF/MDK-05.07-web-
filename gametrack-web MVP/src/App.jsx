import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Library from './pages/Library';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/library" element={<Library />} />
          {/* Заглушки для будущих страниц */}
          <Route path="/search" element={<div className="text-2xl font-bold">Поиск игр (В разработке)</div>} />
          <Route path="/profile" element={<div className="text-2xl font-bold">Профиль (В разработке)</div>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;