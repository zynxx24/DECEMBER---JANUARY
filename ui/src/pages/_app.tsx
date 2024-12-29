import './globals.scss'; 
import { AppProps } from 'next/app';
import Head from 'next/head';

const MyApp = ({ Component, pageProps }: AppProps) => {
  return (
    <>
      <Head>
        <title>X RPL DWISAKA</title>
        <meta name="description" content="MEMBUAT ORANG DESA MENJADI HEBAT!" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div className="min-h-screen bg-gray-100">
        <Component {...pageProps} />
      </div>
    </>
  );
};

export default MyApp;
