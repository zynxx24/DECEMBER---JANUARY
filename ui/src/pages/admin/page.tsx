import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Users, FileText, Home } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '../../plugin/Alert';

interface RequestData {
  Nama: string;
  'Jumlah Bayar Kas': number;
  Status: string;
}

interface MemberData {
  Nama: string;
  Kelas: string;
  Kas: number;
  Jabatan: string;
  Nomor: number;
  Foto?: string;
}

interface AlertState {
  type: 'success' | 'error';
  message: string;
}

export default function AdminDashboard() {
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [activeSection, setActiveSection] = useState<'Dashboard' | 'Requests' | 'Members'>('Dashboard');
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalKas: 0,
    pendingRequests: 0
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch requests
      const requestsResponse = await fetch('http://localhost:5000/draft');
      const requestsData = await requestsResponse.json();
      console.log(requestsData)
      const pendingRequests = requestsData.data?.filter(
        (request: any) => request.Status?.toLowerCase() === 'pending'
      ) || [];
      setRequests(pendingRequests);
      
      // Fetch members
      const membersResponse = await fetch('http://localhost:5000/data');
      const membersData = await membersResponse.json();
      if (membersData.success && membersData.data) {
        setMembers(membersData.data);
        
        // Calculate statistics
        setStats({
          totalMembers: membersData.data.length,
          totalKas: membersData.data.reduce((sum: number, member: MemberData) => sum + (member.Kas || 0) * 10000, 0),
          pendingRequests: pendingRequests.length
        });
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Failed to fetch data. Please try again later.',
      })
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (nama: string, approve: boolean) => {
    try {
      const request = requests.find(req => req.Nama === nama);
      if (!request) {
        throw new Error('Request not found');
      }

      // Update the draft status
      const draftResponse = await fetch('http://localhost:5000/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama,
          got: request['Jumlah Bayar Kas'],
          sst: approve ? 'approved' : 'rejected'
        })
      });

      if (!draftResponse.ok) throw new Error('Failed to update draft status');

      // If approved, update the kas amount
      if (approve) {
        const updateResponse = await fetch('http://localhost:5000/update_data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nama,
            jumlah_bayar_kas: request['Jumlah Bayar Kas']
          })
        });

        if (!updateResponse.ok) throw new Error('Failed to update kas amount');
      }

      setAlert({
        type: 'success',
        message: `Successfully ${approve ? 'approved' : 'rejected'} the request`
      });
      
      // Refresh data
      fetchData();
    } catch (error) {
      setAlert({
        type: 'error',
        message: error instanceof Error ? error.message : 'An error occurred'
      });
    }
  };

  const formatCurrency = (amount: number | undefined | null): string => {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return 'Rp 0';
    }
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const renderDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Total Members</p>
            <p className="text-2xl font-bold">{stats.totalMembers}</p>
          </div>
          <Users className="text-blue-500" size={24} />
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Total Kas</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalKas * 10000)}</p>
          </div>
          <FileText className="text-green-500" size={24} />
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Pending Requests</p>
            <p className="text-2xl font-bold">{stats.pendingRequests}</p>
          </div>
          <AlertCircle className="text-orange-500" size={24} />
        </div>
      </div>
    </div>
  );

  const renderRequests = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold">Pending Requests</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  No pending requests
                </td>
              </tr>
            ) : (
              requests.map(request => (
                <tr key={request.Nama} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{request.Nama}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    Rp {request['Jumlah Bayar Kas'].toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      {request.Status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleApprove(request.Nama, true)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 mr-2"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleApprove(request.Nama, false)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                    >
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Reject
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderMembers = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold">Member List</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kas Streak</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kas Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {members.map(member => (
              <tr key={member.Nama} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">{member.Nama}</td>
                <td className="px-6 py-4 whitespace-nowrap">{member.Kelas}</td>
                <td className="px-6 py-4 whitespace-nowrap">{member.Kas}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(member.Kas * 10000)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{member.Jabatan}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-md">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
        </div>
        <nav className="p-4">
          <button
            onClick={() => setActiveSection('Dashboard')}
            className={`flex items-center w-full px-4 py-2 mb-2 rounded-md ${
              activeSection === 'Dashboard' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Home className="w-5 h-5 mr-2" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveSection('Requests')}
            className={`flex items-center w-full px-4 py-2 mb-2 rounded-md ${
              activeSection === 'Requests' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-5 h-5 mr-2" />
            Requests
          </button>
          <button
            onClick={() => setActiveSection('Members')}
            className={`flex items-center w-full px-4 py-2 rounded-md ${
              activeSection === 'Members' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Users className="w-5 h-5 mr-2" />
            Members
          </button>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        {alert && (
          <Alert variant={alert.type === 'success' ? 'default' : 'destructive'} className="mb-6">
            <AlertTitle>{alert.type === 'success' ? 'Success' : 'Error'}</AlertTitle>
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        )}
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {activeSection === 'Dashboard' && renderDashboard()}
            {activeSection === 'Requests' && renderRequests()}
            {activeSection === 'Members' && renderMembers()}
          </>
        )}
      </main>
    </div>
  );
}