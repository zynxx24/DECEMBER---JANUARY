import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function Checkin() {
    const [nama, setNama] = useState('');
    const [jumlahKas, setJumlahKas] = useState<number | ''>('');
    const [popup, setPopup] = useState(false);
    const [status, setStatus] = useState('Pending');
    const [isChecking, setIsChecking] = useState(false);

    const handleCheckin = async () => {
        if (!nama || jumlahKas === '' || jumlahKas <= 0) {
            toast.error('Please fill in all fields correctly!');
            return;
        }

        try {
            setIsChecking(true);
            await axios.post('http://localhost:5000/checkin', { nama, kas: jumlahKas, status: 'Pending' });
            setPopup(true);
            setStatus('Pending');
            toast.success('Check-in request sent!');
        } catch (error) {
            toast.error('Something went wrong! Please try again.');
        } finally {
            setIsChecking(false);
        }
    };

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (popup && status === 'Pending') {
            interval = setInterval(async () => {
                try {
                    const response = await axios.get(`http://localhost:5000/status?nama=${nama}`);
                    if (response.data.status !== 'Pending') {
                        setStatus(response.data.status);
                        clearInterval(interval!); // Stop polling once status changes
                    }
                } catch (error) {
                    console.error('Error fetching status:', error);
                }
            }, 5000); // Check status every 5 seconds
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [popup, status, nama]);

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <h1 className="text-3xl font-bold mb-6">Check-in Page</h1>
            <input
                className="border rounded px-4 py-2 mb-4 w-72"
                type="text"
                placeholder="Nama"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
            />
            <input
                className="border rounded px-4 py-2 mb-4 w-72"
                type="number"
                placeholder="Jumlah Kas"
                value={jumlahKas}
                onChange={(e) => setJumlahKas(Number(e.target.value))}
            />
            <button
                className={`bg-blue-500 text-white px-6 py-2 rounded ${
                    isChecking ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={handleCheckin}
                disabled={isChecking}
            >
                {isChecking ? 'Sending...' : 'Check-in'}
            </button>

            {popup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded shadow-lg text-center">
                        <h2 className="text-xl font-semibold mb-4">Status: {status}</h2>
                        {status === 'Approved' && <p className="text-green-500">Your check-in has been approved!</p>}
                        {status === 'Rejected' && <p className="text-red-500">Your check-in was rejected.</p>}
                        <button
                            className="mt-4 bg-gray-500 text-white px-4 py-2 rounded"
                            onClick={() => {
                                setPopup(false);
                                setNama('');
                                setJumlahKas('');
                                setStatus('Pending');
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
