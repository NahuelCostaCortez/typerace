'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface UserScore {
  username: string;
  wpm: number;
  date: string;
  won: boolean;
}

export default function AdminPage() {
  const [leaderboard, setLeaderboard] = useState<UserScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [editingScore, setEditingScore] = useState<UserScore | null>(null);
  const [username, setUsername] = useState('');
  const [wpm, setWpm] = useState('');
  const [date, setDate] = useState('');
  const [won, setWon] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    // Only fetch if authenticated
    if (isAuthenticated) {
      fetchLeaderboard();
    }
  }, [isAuthenticated]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/leaderboard');
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      const data = await response.json();
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      setMessage('Error loading leaderboard. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setPasswordError('Por favor, ingrese la contraseña');
      return;
    }

    setIsAuthenticating(true);
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        setPasswordError(null);
      } else {
        setPasswordError('Contraseña incorrecta. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setPasswordError('Error de autenticación. Inténtalo de nuevo.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const resetLeaderboard = async () => {
    if (!confirm('Are you sure you want to reset the leaderboard? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/leaderboard/reset', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to reset leaderboard');
      }

      setMessage('Leaderboard has been reset successfully.');
      setLeaderboard([]);
    } catch (error) {
      console.error('Error resetting leaderboard:', error);
      setMessage('Error resetting leaderboard. Please try again.');
    }
  };

  const saveLeaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leaderboard),
      });

      if (!response.ok) {
        throw new Error('Failed to save leaderboard');
      }

      setMessage('Leaderboard saved successfully.');
    } catch (error) {
      console.error('Error saving leaderboard:', error);
      setMessage('Error saving leaderboard. Please try again.');
    }
  };

  const deleteEntry = (index: number) => {
    const newLeaderboard = [...leaderboard];
    newLeaderboard.splice(index, 1);
    setLeaderboard(newLeaderboard);
    setMessage('Entry removed. Click "Save Changes" to persist.');
  };

  const startEditing = (entry: UserScore) => {
    setEditingScore(entry);
    setUsername(entry.username);
    setWpm(entry.wpm.toString());
    setDate(entry.date);
    setWon(entry.won);
  };

  const cancelEditing = () => {
    setEditingScore(null);
  };

  const saveEdit = () => {
    if (!editingScore) return;
    
    const updatedLeaderboard = leaderboard.map(entry => 
      entry.username === editingScore.username 
        ? { 
            username, 
            wpm: parseInt(wpm), 
            date, 
            won 
          } 
        : entry
    );
    
    setLeaderboard(updatedLeaderboard);
    setEditingScore(null);
    setMessage('Entry updated. Click "Save Changes" to persist.');
  };

  const addNewEntry = () => {
    if (!username || !wpm || !date) {
      setMessage('Please fill in all fields');
      return;
    }

    const newEntry: UserScore = {
      username,
      wpm: parseInt(wpm),
      date,
      won
    };

    setLeaderboard([...leaderboard, newEntry].sort((a, b) => b.wpm - a.wpm));
    setUsername('');
    setWpm('');
    setDate('');
    setWon(true);
    setMessage('New entry added. Click "Save Changes" to persist.');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Admin Access</h1>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-gray-700 mb-1">Contraseña</label>
              <input 
                type="password" 
                id="password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ingrese la contraseña de administrador"
                required
              />
              {passwordError && (
                <p className="mt-2 text-sm text-red-600">{passwordError}</p>
              )}
            </div>
            <button 
              type="submit"
              disabled={isAuthenticating}
              className={`w-full ${isAuthenticating ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
            >
              {isAuthenticating ? 'Verificando...' : 'Acceder'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <Link 
              href="/" 
              className="text-blue-500 hover:text-blue-700 text-sm"
            >
              Volver al juego
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Leaderboard Admin</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setIsAuthenticated(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
            >
              Cerrar sesión
            </button>
            <Link 
              href="/" 
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
            >
              Back to Game
            </Link>
          </div>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded">
            {message}
          </div>
        )}

        {isLoading ? (
          <p className="text-center py-8">Loading leaderboard...</p>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Current Leaderboard</h2>
              {leaderboard.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="py-2 px-4 border-b text-left">Username</th>
                        <th className="py-2 px-4 border-b text-left">WPM</th>
                        <th className="py-2 px-4 border-b text-left">Date</th>
                        <th className="py-2 px-4 border-b text-left">Won</th>
                        <th className="py-2 px-4 border-b text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((entry, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="py-2 px-4 border-b">{entry.username}</td>
                          <td className="py-2 px-4 border-b">{entry.wpm}</td>
                          <td className="py-2 px-4 border-b">{entry.date}</td>
                          <td className="py-2 px-4 border-b">{entry.won ? 'Yes' : 'No'}</td>
                          <td className="py-2 px-4 border-b">
                            <button 
                              onClick={() => startEditing(entry)}
                              className="mr-2 text-blue-500 hover:text-blue-700"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => deleteEntry(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No entries in the leaderboard</p>
              )}
            </div>

            {editingScore && (
              <div className="mb-6 p-4 border border-gray-200 rounded">
                <h2 className="text-lg font-semibold mb-3">Edit Entry</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-1">Username</label>
                    <input 
                      type="text" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">WPM</label>
                    <input 
                      type="number" 
                      value={wpm} 
                      onChange={(e) => setWpm(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">Date</label>
                    <input 
                      type="text" 
                      value={date} 
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">Won</label>
                    <select 
                      value={won ? 'true' : 'false'} 
                      onChange={(e) => setWon(e.target.value === 'true')}
                      className="w-full p-2 border border-gray-300 rounded"
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button 
                    onClick={cancelEditing}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={saveEdit}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            <div className="mb-6 p-4 border border-gray-200 rounded">
              <h2 className="text-lg font-semibold mb-3">Add New Entry</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-1">Username</label>
                  <input 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">WPM</label>
                  <input 
                    type="number" 
                    value={wpm} 
                    onChange={(e) => setWpm(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Date</label>
                  <input 
                    type="text" 
                    value={date} 
                    placeholder="M/D/YYYY"
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Won</label>
                  <select 
                    value={won ? 'true' : 'false'} 
                    onChange={(e) => setWon(e.target.value === 'true')}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>
              <button 
                onClick={addNewEntry}
                className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Add Entry
              </button>
            </div>

            <div className="flex justify-between">
              <button 
                onClick={resetLeaderboard}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Reset Leaderboard
              </button>
              <button 
                onClick={saveLeaderboard}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save Changes
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 