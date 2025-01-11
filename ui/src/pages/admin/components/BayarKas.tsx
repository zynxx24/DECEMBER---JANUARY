import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

export default function CheckinPage() {
  const [formData, setFormData] = useState({
    nama: '',
    jumlahKas: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [status, setStatus] = useState('Pending');

  const handleInputChange = (e: { target: { name: any; value: any; }; }) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    
    if (!formData.nama || !formData.jumlahKas || Number(formData.jumlahKas) <= 0) {
      toast.error('Please fill in all fields correctly');
      return;
    }

    try {
      setIsSubmitting(true);
      await axios.post('http://localhost:5000/approve', {
        nama: formData.nama,
        got: Number(formData.jumlahKas),
        sst: 'Pending'
      });
      setShowModal(true);
      setStatus('Pending');
      toast.success('Check-in request submitted successfully');
    } catch (error) {
      toast.error('Failed to submit check-in request');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    let interval: string | number | NodeJS.Timeout | undefined;
    
    if (showModal && status === 'Pending') {
      interval = setInterval(async () => {
        try {
          const response = await axios.get(`http://localhost:5000/draft`);
          const userDraft = response.data.data.find(
            (            draft: { Nama: string; }) => draft.Nama === formData.nama
          );
          
          if (userDraft && userDraft.Status !== 'Pending') {
            setStatus(userDraft.Status);
            clearInterval(interval);
          }
        } catch (error) {
          console.error('Error checking status:', error);
        }
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showModal, status, formData.nama]);

  const getStatusIcon = () => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'Rejected':
        return <XCircle className="w-16 h-16 text-red-500" />;
      case 'Pending':
        return <Clock className="w-16 h-16 text-yellow-500 animate-pulse" />;
      default:
        return <AlertCircle className="w-16 h-16 text-gray-500" />;
    }
  };

  const resetForm = () => {
    setFormData({ nama: '', jumlahKas: '' });
    setShowModal(false);
    setStatus('Pending');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Check-in System
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                name="nama"
                value={formData.nama}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">Rp</span>
                <input
                  type="number"
                  name="jumlahKas"
                  value={formData.jumlahKas}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="0"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Check-in'}
            </button>
          </form>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full">
            <div className="flex flex-col items-center text-center">
              {getStatusIcon()}
              
              <h2 className="text-2xl font-bold mt-6 mb-2">
                Check-in {status}
              </h2>
              
              <p className="text-gray-600 mb-6">
                {status === 'Pending' ? 'Waiting for approval...' :
                 status === 'Approved' ? 'Your check-in has been approved!' :
                 status === 'Rejected' ? 'Your check-in was rejected.' :
                 'Unknown status'}
              </p>

              {status !== 'Pending' && (
                <button
                  onClick={resetForm}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}