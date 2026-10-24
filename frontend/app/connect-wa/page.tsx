"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { backendRequest } from "@/lib/backendApi";

const REFRESH_INTERVAL_MS = 20_000;

export default function ConnectWhatsAppPage() {
  const [qrImage, setQrImage] = useState("");
  const [message, setMessage] = useState("Mulai koneksi untuk meminta QR WhatsApp.");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;

    let active = true;
    let requestId = 0;
    const refreshQr = async () => {
      const currentRequest = ++requestId;
      try {
        const result = await backendRequest<{ qr?: string }>("qr");
        if (!result.qr) {
          setQrImage("");
          setMessage("QR belum tersedia. WhatsApp mungkin sedang menyambungkan sesi.");
          return;
        }

        const dataUrl = await QRCode.toDataURL(result.qr, {
          errorCorrectionLevel: "M",
          margin: 2,
          width: 280,
        });
        if (!active || currentRequest !== requestId) return;
        setQrImage(dataUrl);
        setMessage("Pindai QR ini menggunakan WhatsApp. QR diperbarui tiap 20 detik.");
      } catch (error) {
        if (!active || currentRequest !== requestId) return;
        setQrImage("");
        setMessage(error instanceof Error ? error.message : "Gagal memuat QR.");
      } finally {
        if (active && currentRequest === requestId) setLoading(false);
      }
    };

    setLoading(true);
    void refreshQr();
    const timer = window.setInterval(() => {
      setLoading(true);
      void refreshQr();
    }, REFRESH_INTERVAL_MS);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [started]);

  const startConnection = async () => {
    setLoading(true);
    setMessage("Memulai koneksi WhatsApp…");
    try {
      await backendRequest("connect", { method: "POST", body: {} });
      setStarted(true);
      setMessage("Menunggu QR dari WhatsApp…");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal memulai koneksi.");
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <section
        style={{
          width: "100%",
          maxWidth: 420,
          display: "grid",
          justifyItems: "center",
          gap: 18,
          padding: 28,
          border: "1px solid rgba(148, 163, 184, 0.25)",
          borderRadius: 20,
          background: "#101d2f",
          textAlign: "center",
        }}
      >
        <div>
          <h1 style={{ margin: "0 0 8px" }}>Hubungkan WhatsApp</h1>
          <p style={{ margin: 0, color: "#9fb0c9" }}>
            Sesi aman diverifikasi melalui akun workspace. Token backend tidak dikirim ke browser.
          </p>
        </div>
        <div
          aria-live="polite"
          style={{
            minHeight: 300,
            width: 300,
            display: "grid",
            placeItems: "center",
            padding: 10,
            borderRadius: 12,
            background: "white",
          }}
        >
          {qrImage ? (
            <img src={qrImage} alt="QR code untuk menghubungkan WhatsApp" width={280} height={280} />
          ) : (
            <p style={{ maxWidth: 250, color: "#334155" }}>{loading ? "Memuat QR..." : message}</p>
          )}
        </div>
        <p style={{ margin: 0, color: "#9fb0c9" }}>{message}</p>
        {!started && (
          <button className="save-button" type="button" onClick={() => void startConnection()} disabled={loading}>
            {loading ? "Starting…" : "Start connection"}
          </button>
        )}
        <a href="/" style={{ color: "#9fb0c9" }}>Back to inbox</a>
      </section>
    </main>
  );
}
