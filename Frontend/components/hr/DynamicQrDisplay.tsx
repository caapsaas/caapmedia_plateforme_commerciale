import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { RefreshCw, MapPin, Download, Printer } from 'lucide-react';
import { qrCodeToJpeg } from '../../utils/qrCodeExport';
import { getAttendanceQr, replaceAttendanceQr } from '../../services/apihr/apiAttendance';

interface DynamicQrData {
  token: string;
  qrUrl: string;
}

export const DynamicQrDisplay: React.FC = () => {
  const [qrData, setQrData] = useState<DynamicQrData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const fetchQrData = async () => {
    try {
      setLoading(true);
      const data = await getAttendanceQr();
      setQrData(data);
      setError(null);
    } catch (err: any) {
      setError('Erreur lors de la récupération du QR code');
    } finally {
      setLoading(false);
    }
  };

  const replaceQrCode = async () => {
    if (!window.confirm('Remplacer le QR permanent ? Le code déjà imprimé cessera de fonctionner et devra être réimprimé.')) return;
    try {
      setLoading(true);
      const data = await replaceAttendanceQr();
      setQrData(data);
      setError(null);
    } catch (err: any) {
      setError('Erreur lors de la génération du token');
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = async () => {
    const svg = qrRef.current?.querySelector('svg');
    if (svg && !isDownloading) {
      setIsDownloading(true);
      try {
        const image = await qrCodeToJpeg(svg);
        const link = document.createElement('a');
        link.href = image;
        link.download = `qr_pointage_${new Date().toISOString().split('T')[0]}.jpg`;
        link.click();
      } catch (error) {
        console.error('Erreur lors de la génération du QR code:', error);
      } finally {
        setIsDownloading(false);
      }
    }
  };

  const printQRCode = () => {
    if (qrRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>QR Code de Pointage</title>
              <style>
                body {
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  margin: 0;
                  padding: 20px;
                  font-family: Arial, sans-serif;
                }
                .qr-container {
                  text-align: center;
                  padding: 40px;
                  border: 2px solid #333;
                  border-radius: 10px;
                }
                h2 {
                  margin-bottom: 10px;
                  color: #333;
                }
                p {
                  color: #666;
                  margin-bottom: 20px;
                }
              </style>
            </head>
            <body>
              <div class="qr-container">
                <h2>QR Code de Pointage</h2>
                <p>Scannez ce code pour pointer votre présence</p>
                ${qrRef.current.innerHTML}
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  useEffect(() => {
    fetchQrData();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-slate-300 border-t-[#c6e911] rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchQrData}
            className="mt-2 text-red-600 underline hover:text-red-800"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-800">QR Code de Pointage</h3>
        <button
          onClick={replaceQrCode}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Remplacer le QR
        </button>
      </div>

      <div className="flex flex-col items-center">
        <div 
          ref={qrRef}
          className="bg-white p-6 rounded-xl border-2 border-slate-200 shadow-inner mb-4"
        >
          {qrData && (
            <QRCode
              value={qrData.qrUrl}
              size={200}
              level="H"
              includeMargin
            />
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
          <MapPin className="w-4 h-4" />
          <p>QR permanent : il reste valide jusqu’à son remplacement manuel.</p>
        </div>
        <p className="text-xs text-slate-500 text-center mb-6">Gardez le QR affiché dans les locaux. Chaque demande de pointage est vérifiée par le système.</p>

        <div className="flex justify-center gap-4">
          <button
            onClick={downloadQRCode}
            disabled={!qrData || isDownloading}
            className="bg-[#c6e911] hover:bg-[#b0cc0f] text-slate-800 font-semibold py-3 px-6 rounded-lg shadow transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            Télécharger
          </button>
          <button
            onClick={printQRCode}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-6 rounded-lg shadow transition-colors flex items-center gap-2"
          >
            <Printer className="w-5 h-5" />
            Imprimer
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-slate-50 rounded-lg">
        <h4 className="font-semibold text-slate-800 mb-2">Instructions :</h4>
        <ol className="text-sm text-slate-600 space-y-1 list-decimal list-inside">
          <li>L'employé scanne le QR code avec son téléphone</li>
          <li>Il saisit son matricule et choisit arrivée ou départ</li>
          <li>Il autorise les vérifications nécessaires sur son appareil</li>
          <li>Le système valide la demande avant l’enregistrement</li>
        </ol>
      </div>
    </div>
  );
};

export default DynamicQrDisplay;
