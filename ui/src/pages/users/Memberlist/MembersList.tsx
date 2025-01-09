"use client";
import React, { useEffect, useState } from 'react';
type Member = {
  Nama: string;
  Nomor: number;
  Kelas: string;
  Kas: number;
  Jabatan: string;
  Foto: string;
};

const Members = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('http://localhost:5000/data');
        const result = await response.json();
        if (Array.isArray(result.data)) {
          setMembers(result.data);
          setFilteredMembers(result.data);
          console.log(members)
        } else {
          console.error('Unexpected data structure:', result);
          setError('Invalid data structure');
        }
      } catch (err) {
        console.error('Error fetching members:', err);
        setError('Failed to fetch data');
      }
    };

  fetchMembers();
}, []);


  useEffect(() => {
    if (searchTerm) {
      const filtered = members.filter((member) =>
        member.Nama.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers(members);
    }
  }, [searchTerm, members]);

  const handleMemberClick = (member: Member) => {
    setSelectedMember(member);
  };

  const closeModal = () => {
    setSelectedMember(null);
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl font-sans text-gray-900">
      <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">Members List</h1>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search by name..."
        className="w-full p-4 mb-6 border rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filteredMembers.map((member) => (
          <div
            key={member.Nomor}
            className="group bg-white shadow-lg rounded-2xl p-4 flex flex-col items-center justify-between w-full h-full min-h-[350px] transition-transform transform hover:scale-105 hover:shadow-xl cursor-pointer"
            onClick={() => handleMemberClick(member)}
          >
            <img
              src={member.Foto}
              alt={`Foto ${member.Nama}`}
              className="w-full h-[200px] object-cover rounded-lg mb-4"
            />
            <h2 className="text-lg font-semibold text-center text-gray-700 truncate w-full">
              {member.Nama}
            </h2>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">{selectedMember.Nama}</h2>
              <button
                className="text-gray-400 hover:text-gray-700"
                onClick={closeModal}
              >
                ✖
              </button>
            </div>
            <img
              src={selectedMember.Foto}
              alt={`Foto ${selectedMember.Nama}`}
              className="w-full h-[240px] object-cover rounded-lg mb-4"
            />
            <div className="space-y-2 text-sm">
              <p><strong className="text-gray-600">No:</strong> {selectedMember.Nomor}</p>
              <p><strong className="text-gray-600">Kelas:</strong> {selectedMember.Kelas}</p>
              <p><strong className="text-gray-600">Jumlah Bayar Kas:</strong> {selectedMember.Kas}</p>
              <p><strong className="text-gray-600">Jabatan:</strong> {selectedMember.Jabatan}</p>
            </div>
          </div>
        </div>
      )}
      {error && <p className="text-red-500 text-center"><strong>{error}</strong></p>}
    </div>
  );
};

export default Members;
