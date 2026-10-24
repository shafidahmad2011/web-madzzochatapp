"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

const REFRESH_INTERVAL_MS = 20_000;

export default function ConnectWhatsAppPage() {
  const [apiToken, setApiToken] = useState("");
  const [qrImage, setQrImage] = useState("");
  const [message, setMessage] = useState("Masukkan API token untuk memuat QR.");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!apiToken) return;

    let active = true;
    let requestId = 0;

    const refreshQr = async () => {
      const currentRequest = ++requestId;
      setLoading(true);

      try {
        const response = await fetch("/api/qr", {
          headers: { Authorization: `Bearer ${apiToken}` },
          cache: "no-store",
        });
        const result: { qr?: string; error?: string } = await response.json();

        if (!active || currentRequest !== requestId) return;
        if (!response.ok || !result.qr) {
          setQrImage("");
          setMessage(result.error || "QR belum tersedia. Coba lagi sebentar.");
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
      } catch {
        if (!active || currentRequest !== requestId) return;
        setQrImage("");
        setMessage("Gagal memuat QR. Periksa koneksi dan konfigurasi backend.");
      } finally {
        if (active && currentRequest === requestId) setLoading(false);
      }
    };

    void refreshQr();
    const timer = window.setInterval(() => void refreshQr(), REFRESH_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [apiToken]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
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
            Token dikirim hanya ke API backend dan tidak disimpan oleh halaman.
          </p>
        </div>

        <label style={{ width: "100%", textAlign: "left" }}>
          API token
          <input
            type="password"
            autoComplete="off"
            value={apiToken}
            onChange={(event) => {
              setApiToken(event.target.value.trim());
              setQrImage("");
              setMessage("Memuat QR...");
            }}
            placeholder="Masukkan API_TOKEN backend"
            style={{
              display: "block",
              width: "100%",
              marginTop: 8,
              padding: 12,
              border: "1px solid rgba(148, 163, 184, 0.35)",
              borderRadius: 10,
              background: "#0a1628",
              color: "#e6eefb",
            }}
          />
        </label>

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
            // This QR data URL is generated locally from the authenticated QR string.
            <img src={qrImage} alt="QR code untuk menghubungkan WhatsApp" width={280} height={280} />
          ) : (
            <p style={{ maxWidth: 250, color: "#334155" }}>
              {loading ? "Memuat QR..." : message}
            </p>
          )}
        </div>

        <p style={{ margin: 0, color: "#9fb0c9" }}>{message}</p>
      </section>
    </main>
  );
}
