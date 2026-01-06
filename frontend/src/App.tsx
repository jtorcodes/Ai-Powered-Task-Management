import { useState, useEffect } from 'react';
import axios from 'axios';

interface Task {
  id: number;
  title: string;
  completed: boolean;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [suggestion, setSuggestion] = useState<{taskTitle: string; suggestionText: string} | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks/');
      setTasks(response.data);
    } catch (err) {
      setError('Failed to fetch tasks');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      const response = await api.post('/tasks/', {
        title: newTaskTitle,
        completed: false,
      });
      setTasks([...tasks, response.data]);
      setNewTaskTitle('');
    } catch (err) {
      console.error('Error adding task:', err);
    }
  };

  const toggleTask = async (task: Task) => {
    try {
      const response = await api.put(`/tasks/${task.id}`, {
        title: task.title,
        completed: !task.completed,
      });
      setTasks(tasks.map(t => (t.id === task.id ? response.data : t)));
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  const deleteTask = async (id: number) => {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(tasks.filter(task => task.id !== id));
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
  };

  const handleEditSave = async (task: Task) => {
    try {
      const response = await api.put(`/tasks/${task.id}`, {
        title: editingTitle,
        completed: task.completed,
      });
      setTasks(tasks.map(t => (t.id === task.id ? response.data : t)));
      setEditingTaskId(null);
      setEditingTitle('');
    } catch (err) {
      console.error('Error updating title:', err);
    }
  };

  const handleGetSuggestion = async (task: Task) => {
    setSuggestionLoading(true);
    setSuggestion(null);
    try {
      const response = await api.post('/suggestions/', null, {
        params: {
          title: task.title
        }
      });
      // Convert numbered list items to line breaks for better formatting
      const formattedSuggestion = response.data.suggestion
        .replace(/\*\*/g, '') // Remove bold markers
        .replace(/\d+\.\s+/g, '\n• '); // Convert numbered list to bullet points
      setSuggestion({
        taskTitle: task.title,
        suggestionText: formattedSuggestion.trim()
      });
    } catch (err) {
      console.error('Error fetching suggestion:', err);
      setSuggestion({
        taskTitle: 'Error',
        suggestionText: 'Failed to get suggestion. Please try again.'
      });
    } finally {
      setSuggestionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Task Management</h1>
        <div className="flex mb-6">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="New task title"
            className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
          />
          <button
            onClick={handleAddTask}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-md transition duration-200"
          >
            Add Task
          </button>
        </div>

        <ul className="space-y-3">
          {tasks.map(task => (
            <li
              key={task.id}
              className={`flex items-center justify-between p-4 border rounded-lg ${
                task.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex-grow flex items-center">
                <span
                  onClick={() => toggleTask(task)}
                  className={`mr-3 cursor-pointer ${
                    task.completed ? 'text-green-500' : 'text-gray-500'
                  }`}
                >
                  {task.completed ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </span>
                {editingTaskId === task.id ? (
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => handleEditSave(task)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEditSave(task)}
                    autoFocus
                    className="flex-grow border-b border-gray-300 focus:outline-none focus:border-blue-500 bg-transparent"
                  />
                ) : (
                  <span
                    className={`flex-grow cursor-text ${
                      task.completed ? 'line-through text-gray-400' : 'text-gray-700'
                    }`}
                    onClick={() => handleEdit(task)}
                  >
                    {task.title}
                  </span>
                )}
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => handleGetSuggestion(task)}
                  disabled={suggestionLoading}
                  className="text-blue-500 hover:text-blue-700 ml-4 transition duration-200 disabled:opacity-50"
                  title="Get suggestion"
                >
                  {suggestionLoading ? (
                    <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-red-500 hover:text-red-700 ml-4 transition duration-200"
                  title="Delete task"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>

        {suggestionLoading && (
          <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-lg flex items-center">
            <svg className="animate-spin h-5 w-5 text-blue-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Getting suggestion...
          </div>
        )}

      {suggestion && !suggestionLoading && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg relative">
          <button 
            onClick={() => setSuggestion(null)}
            className="absolute top-3 right-3 text-blue-400 hover:text-blue-600 transition-colors"
            title="Close suggestion"
            aria-label="Close suggestion"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="pr-6"> {/* Add padding to prevent text from overlapping close button */}
            <div className="font-semibold text-blue-800 mb-2">
              <span className="text-blue-600">Suggestion for:</span> "{suggestion.taskTitle}"
            </div>
            <div className="p-3 whitespace-pre-line">
              <span className="font-medium text-blue-700">How to complete:</span>
              <div className="mt-1 text-gray-800">{suggestion.suggestionText}</div>
            </div>
          </div>
        </div>
      )}

        {tasks.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No tasks found. Add one above!
          </div>
        )}
      </div>
    </div>
  );
}

export default App;