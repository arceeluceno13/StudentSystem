import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const [userData, setUserData] = useState([]);
    const [newData, setNewData] = useState('');
    const [editData, setEditData] = useState({ id: null, data: '' });
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:3000/user-data', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setUserData(response.data);
        } catch (error) {
            alert('Failed to fetch user data');
            navigate('/login');
        }
    };

    const handleAddData = async () => {
        if (!newData.trim()) {
            alert('Please enter valid data');
            return;
        }
    
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:3000/user-data',
                { data: newData },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setNewData('');
            fetchData(); // Refresh data
        } catch (error) {
            if (error.response && error.response.data.error) {
                alert(error.response.data.error); // Show backend validation error
            } else {
                alert('Failed to add data');
            }
        }
    };
    
    const handleEditData = async () => {
        if (!editData.data.trim()) {
            alert('Please enter valid data');
            return;
        }
    
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `http://localhost:3000/user-data/${editData.id}`,
                { data: editData.data },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setEditData({ id: null, data: '' });
            fetchData(); // Refresh data
        } catch (error) {
            if (error.response && error.response.data.error) {
                alert(error.response.data.error); // Show backend validation error
            } else {
                alert('Failed to update data');
            }
        }
    };

    const handleDeleteData = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:3000/user-data/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            fetchData(); // Refresh data
        } catch (error) {
            alert('Failed to delete data');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-blue-500 p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-white text-4xl font-bold">Dashboard</h1>
                    <button onClick={handleLogout} className="bg-red-500 text-white p-2 rounded">
                        Logout
                    </button>
                </div>
            </nav>
            <div className="container mx-auto p-4">
                <h2 className="text-2xl font-bold mb-4">Your Data</h2>

                {/* Add Data Form */}
                <div className="mb-6">
                    <input
                        type="text"
                        value={newData}
                        onChange={(e) => setNewData(e.target.value)}
                        placeholder="Enter new data"
                        className="w-full p-2 border rounded mb-2"
                    />
                    <button onClick={handleAddData} className="bg-green-500 text-white p-2 rounded">
                        Add Data
                    </button>
                </div>

                {/* Edit Data Form */}
                {editData.id && (
                    <div className="mb-6">
                        <input
                            type="text"
                            value={editData.data}
                            onChange={(e) => setEditData({ ...editData, data: e.target.value })}
                            className="w-full p-2 border rounded mb-2"
                        />
                        <button onClick={handleEditData} className="bg-yellow-500 text-white p-2 rounded">
                            Save Changes
                        </button>
                    </div>
                )}

                {/* Display Data */}
                <ul>
                    {userData.map((item) => (
                        <li key={item.id} className="bg-white p-4 rounded shadow mb-2 flex justify-between items-center">
                            {item.data}
                            <div>
                                <button
                                    onClick={() => setEditData({ id: item.id, data: item.data })}
                                    className="bg-blue-500 text-white p-1 rounded mr-2"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteData(item.id)}
                                    className="bg-red-500 text-white p-1 rounded"
                                >
                                    Delete
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Dashboard;