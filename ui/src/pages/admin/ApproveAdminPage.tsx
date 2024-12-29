// pages/approve.tsx
import { useState, useEffect } from 'react';

interface User {
    Nama: string;
    JumlahKamar: number;
    Status: string;
}

const ApproveAdminPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Fetch pending users from the backend
        const fetchUsers = async () => {
            const response = await fetch('http://localhost:5000/draft');
            const data = await response.json();
            setUsers(data.filter((user: User) => user.Status === 'Pending'));
        };

        fetchUsers();
    }, []);

    const handleApprove = async (name: string, approve: boolean) => {
        const response = await fetch('http://localhost:5000/approve', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, approve }),
        });

        const result = await response.json();

        if (response.ok) {
            setMessage(result.message);
            setUsers((prevUsers) => prevUsers.filter((user) => user.Nama !== name));
        } else {
            setMessage(result.message || 'An error occurred.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-2xl">
                <h1 className="text-2xl font-bold mb-4">Approve Pending Requests</h1>
                {users.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                        {users.map((user) => (
                            <li key={user.Nama} className="py-4 flex items-center justify-between">
                                <div>
                                    <p className="text-lg font-medium text-gray-900">{user.Nama}</p>
                                    <p className="text-sm text-gray-500">
                                        Rooms Requested: {user.JumlahKamar}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleApprove(user.Nama, true)}
                                        className="bg-green-500 text-white py-1 px-3 rounded-md hover:bg-green-600"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleApprove(user.Nama, false)}
                                        className="bg-red-500 text-white py-1 px-3 rounded-md hover:bg-red-600"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-gray-500">No pending requests at the moment.</p>
                )}
                {message && (
                    <p className="mt-4 text-center text-sm text-gray-500">{message}</p>
                )}
            </div>
        </div>
    );
};

export default ApproveAdminPage;
