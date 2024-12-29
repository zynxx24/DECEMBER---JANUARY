import { useEffect, useState } from 'react';
import axios from 'axios';

interface RequestData {
  Nama: string;
  'Jumlah Bayar Kas'?: number;
  Status: string;
// Optional, since not all requests may have this
}

interface MemberData {
  Nama: string;
  Kelas: string;
  Kas: number;
  Jabatan: string;
}

export default function AdminDashboard() {
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [activeSection, setActiveSection] = useState<'About' | 'Request' | 'Members'>('About');
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetch('http://localhost:5000/draft');
        const drafts = await response.json();
        setRequests(drafts.filter((user: RequestData) => user.Status.trim().toLowerCase() === 'pending'));
      } catch (error) {
        console.error('Error fetching request data:', error);
      } finally {
        setLoadingRequests(false);
      }
    };

    const fetchMembers = async () => {
      try {
        const response = await axios.get('http://localhost:5000/data');
        setMembers(response.data.data || []);
      } catch (error) {
        console.error('Error fetching member data:', error);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchRequests();
    fetchMembers();

    const requestInterval = setInterval(fetchRequests, 5000);
    const memberInterval = setInterval(fetchMembers, 5000);

    return () => {
      clearInterval(requestInterval);
      clearInterval(memberInterval);
    };
  }, []);

  const handleApprove = async (nama: string, approve: boolean) => {
    try {
      const requestToApprove = requests.find((request) => request.Nama === nama);
      if (!requestToApprove) {
        setMessage('Request not found.');
        return;
      }

      const kasAmount = requestToApprove['Jumlah Bayar Kas'] || 0;

      const response = await axios.post('http://localhost:5000/approve', {
        nama,
        approve,
        kasAmount,
      });

      if (response.status === 200) {
        setMessage(response.data.message || 'Action completed successfully.');
        setRequests((prevRequests) => prevRequests.filter((request) => request.Nama !== nama));
      }
    } catch (error) {
      console.error('Error approving request:', error);
      setMessage('An error occurred while processing the request.');
    }
  };

  const renderSection = () => {
    if (activeSection === 'Request') {
      return (
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Request List</h2>
          {loadingRequests ? (
            <p>Loading requests...</p>
          ) : requests.length > 0 ? (
            <table className="w-full table-auto border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="border px-4 py-2">Nama</th>
                  <th className="border px-4 py-2">Jumlah Kamar</th>
                  <th className="border px-4 py-2">Status</th>
                  <th className="border px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.Nama} className="hover:bg-gray-50">
                    <td className="border px-4 py-2">{request.Nama}</td>
                    <td className="border px-4 py-2">{request['Jumlah Bayar Kas']}</td>
                    <td className="border px-4 py-2">{request.Status}</td>
                    <td className="border px-4 py-2">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprove(request.Nama, true)}
                          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleApprove(request.Nama, false)}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-gray-500">No pending requests at the moment.</p>
          )}
          {message && <p className="mt-4 text-center text-sm text-gray-500">{message}</p>}
        </div>
      );
    }

    if (activeSection === 'Members') {
      return (
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Members</h2>
          {loadingMembers ? (
            <p>Loading members...</p>
          ) : (
            <table className="w-full table-auto border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="border px-4 py-2">Nama</th>
                  <th className="border px-4 py-2">Kelas</th>
                  <th className="border px-4 py-2">Jumlah Bayar Kas</th>
                  <th className="border px-4 py-2">Jabatan</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.Nama} className="hover:bg-gray-50">
                    <td className="border px-4 py-2">{member.Nama}</td>
                    <td className="border px-4 py-2">{member.Kelas}</td>
                    <td className="border px-4 py-2">{member.Kas}</td>
                    <td className="border px-4 py-2">{member.Jabatan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      );
    }

    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold">Welcome to Admin Dashboard</h2>
        <p className="text-gray-600 mt-2">Manage your data efficiently.</p>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-gray-800 text-white flex flex-col items-center py-6">
        <h1 className="text-2xl font-bold mb-8">Admin Dashboard</h1>
        <nav className="w-full">
          {['About', 'Request', 'Members'].map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section as any)}
              className={`w-full py-3 px-4 text-left hover:bg-gray-700 ${
                activeSection === section ? 'bg-gray-700' : ''
              }`}
            >
              {section}
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">{renderSection()}</main>
    </div>
  );
}
