import { GetStaticPaths, GetStaticProps } from 'next';

interface Berita {
    'No induk': number;
    Judul: string;
    DESKRIPSI: string;
    Sumber?: string;
    Gambar?: string;
}

interface BeritaDetailProps {
    berita: Berita;
}

const BeritaDetail = ({ berita }: BeritaDetailProps) => {
    return (
        <div>
            <h1>{berita.Judul}</h1>
            <img src={berita.Gambar} alt={berita.Judul} style={{ width: '100%' }} />
            <p>{berita.DESKRIPSI}</p>
            {berita.Sumber && <p><strong>Sumber:</strong> {berita.Sumber}</p>}
        </div>
    );
};

export const getStaticPaths: GetStaticPaths = async () => {
    const res = await fetch('http://localhost:5000/berita');
    const data: Berita[] = (await res.json()).data;

    const paths = data.map((berita) => ({
        params: { id: berita['No induk'].toString() },
    }));

    return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
    const res = await fetch('http://localhost:5000/berita');
    const data: Berita[] = (await res.json()).data;

    const berita = data.find((item) => item['No induk'].toString() === params?.id);

    return {
        props: {
            berita: berita || null,
        },
    };
};

export default BeritaDetail;
