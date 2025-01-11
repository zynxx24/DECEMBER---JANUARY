import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface Berita {
    'No induk': number;
    Judul: string;
    DESKRIPSI: string;
    Sumber?: string;
    Gambar?: string;
}

const BeritaDetail = () => {
    const router = useRouter();
    const { id } = router.query;
    const [berita, setBerita] = useState<Berita | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBerita = async () => {
            if (!id) return;
            
            try {
                setLoading(true);
                const res = await fetch('http://localhost:5000/berita');
                const data: { data: Berita[] } = await res.json();
                const foundBerita = data.data.find(
                    (item) => item['No induk'].toString() === id
                );
                
                if (foundBerita) {
                    setBerita(foundBerita);
                } else {
                    setError('Berita tidak ditemukan');
                }
            } catch (err) {
                setError('Terjadi kesalahan saat mengambil data');
            } finally {
                setLoading(false);
            }
        };

        fetchBerita();
    }, [id]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;
    if (!berita) return <div>Berita tidak ditemukan</div>;

    return (
        <div>
            <h1>{berita.Judul}</h1>
            {berita.Gambar && (
                <img 
                    src={berita.Gambar} 
                    alt={berita.Judul} 
                    style={{ width: '100%' }} 
                />
            )}
            <p>{berita.DESKRIPSI}</p>
            {berita.Sumber && (
                <p><strong>Sumber:</strong> {berita.Sumber}</p>
            )}
        </div>
    );
};

export default BeritaDetail;