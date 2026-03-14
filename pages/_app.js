import Head from "next/head";
import PwaRuntime from "../components/PwaRuntime";
import "../app/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="application-name" content="JOEAGENT" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="JOEAGENT" />
      </Head>
      <PwaRuntime />
      <Component {...pageProps} />
    </>
  );
}
