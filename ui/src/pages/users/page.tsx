import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaSpotify, FaInstagram, FaTiktok } from 'react-icons/fa';
import Members from './Memberlist/MembersList';
import SmartImage from '../components/animation/Loader';

interface Berita {
  'No induk': number;
  Judul: string;
  DESKRIPSI?: string;
  Sumber?: string;
  Gambar: string;
}

const Users = () => {
  const [beritaTerbaru, setBeritaTerbaru] = useState<Berita[]>([]);
  const [activeSection, setActiveSection] = useState<'about' | 'Lomba' | 'gallery' | 'news'>('about');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredNews, setFilteredNews] = useState<Berita[]>([]);

  useEffect(() => {
    // Fetch data when the component mounts
    const fetchBerita = async () => {
      try {
        const res = await fetch('http://localhost:5000/berita');
        if (!res.ok) {
          throw new Error(`Failed to fetch, status: ${res.status}`);
        }
        const jsonData = await res.json();
        const beritaData: Berita[] = jsonData?.data || []; // Safely handle `data`
        setBeritaTerbaru(beritaData.slice(0, 4)); // Limit to the first 4 items
      } catch (error) {
        console.error('Error fetching berita:', error);
        setBeritaTerbaru([]);
      }
    };

    fetchBerita();
  }, []);

  useEffect(() => {
    // Filter news when searchTerm or beritaTerbaru changes
    if (searchTerm) {
      const filtered = beritaTerbaru.filter((berita) =>
        berita.Judul.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredNews(filtered);
    } else {
      setFilteredNews(beritaTerbaru);
    }
  }, [searchTerm, beritaTerbaru]);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 flex flex-col">
        {/* Header Section */}
        <header className="bg-gradient-to-r from-blue-500 to-blue-700 text-white py-8 shadow-md rounded-b-3xl">
          <div className="container mx-auto text-center">
            <h1 className="text-5xl font-bold tracking-tight">X RPL DWISAKA</h1>
            <p className="text-lg mt-3 font-medium">A Modern Website Crafted by SMKN Students</p>
          </div>
        </header>

        {/* Section Navigation */}
        <section className="bg-white shadow-md rounded-full sticky top-4 z-10 py-3 px-6 mx-auto w-fit flex space-x-4">
          {['about', 'Lomba', 'gallery', 'news'].map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section as 'about' | 'Lomba' | 'gallery' | 'news')}
              className={`px-4 py-2 rounded-full font-semibold transition-all text-sm ${
                activeSection === section
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-blue-500'
              }`}
            >
              {section === 'about'
                ? 'About'
                : section === 'Lomba'
                ? 'Tournament'
                : section === 'gallery'
                ? 'Gallery'
                : 'News'}
            </button>
          ))}
        </section>

        {/* Section Content */}
        <main className="flex-grow container mx-auto py-10 px-6">
          {activeSection === 'about' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">About Us</h2>
              <p className="text-gray-600 leading-relaxed">
                Welcome to the official website of X RPL DWISAKA! Here, you can explore our latest updates, events, and achievements.
              </p>
            </div>
          )}

          {activeSection === 'Lomba' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Upcoming Tournament</h2>
              <p className="text-gray-600 leading-relaxed mb-4">LOMBA ANTAR KELAS 3RD</p>
              <img
                src="https://dummyimage.com/600x400/000/fff.jpg"
                alt="Tournament"
                className="rounded-xl shadow-md hover:shadow-lg transition-all"
              />
            </div>
          )}

          {activeSection === 'gallery' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Gallery</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Array(6)
                  .fill('https://dummyimage.com/400x300/000/fff.jpg')
                  .map((img, index) => (
                    <div
                      key={index}
                      className="relative group overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-shadow"
                    >
                      <img
                        src={img}
                        alt={`Gallery Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white font-semibold">Image {index + 1}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {activeSection === 'news' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Latest News</h2>
              <input
                type="text"
                placeholder="Search News"
                className="w-full p-4 mb-5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredNews.map((berita) => (
                  <Link key={berita['No induk']} href={`/berita/${berita['No induk']}`}>
                    <div className="bg-white shadow-md rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                      <SmartImage src={berita.Gambar} alt={berita.Judul} />
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-500 transition-colors">
                          {berita.Judul}
                        </h3>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          <Members></Members>
        </main>

        {/* Footer Section */}
        <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-8 rounded-t-3xl">
          <div className="container mx-auto text-center">
            <p className="mb-4 text-sm">&copy; {new Date().getFullYear()} X RPL DWISAKA. All rights reserved.</p>
            <div className="flex justify-center space-x-6">
              <a
                href="https://spotify.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-green-500 transition-colors"
              >
                <FaSpotify size={24} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-pink-500 transition-colors"
              >
                <FaInstagram size={24} />
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-black transition-colors"
              >
                <FaTiktok size={24} />
              </a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Users;
