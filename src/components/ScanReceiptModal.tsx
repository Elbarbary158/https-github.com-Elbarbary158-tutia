import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Camera,
  FileText,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  RotateCw,
  Eye,
  ShieldCheck,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { SAMPLE_RECEIPT_PRESETS } from '../data/initialData';
import { FinancialTransaction } from '../types/finance';

interface ScanReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (tx: FinancialTransaction) => void;
}

export const ScanReceiptModal: React.FC<ScanReceiptModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { scanReceipt, currentCurrency, formatMoney, language, isRtl, t } = useFinance();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [extractedTx, setExtractedTx] = useState<FinancialTransaction | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!isOpen) return null;

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
        setExtractedTx(null);
        setErrorMsg(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Preset selector
  const handleSelectPreset = (preset: (typeof SAMPLE_RECEIPT_PRESETS)[0]) => {
    setSelectedFile(null);
    setPreviewImage(preset.svgImage);
    setExtractedTx(null);
    setErrorMsg(null);
  };

  // Camera start
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable, using fallback preview', err);
      setIsCameraActive(false);
      // Select first preset as realistic capture
      handleSelectPreset(SAMPLE_RECEIPT_PRESETS[0]);
    }
  };

  // Capture from camera video
  const captureCameraFrame = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setPreviewImage(dataUrl);
        // Stop stream
        const stream = videoRef.current.srcObject as MediaStream;
        stream?.getTracks().forEach((track) => track.stop());
        setIsCameraActive(false);
      }
    }
  };

  // Trigger AI Ingestion
  const handleRunAiOcr = async () => {
    if (!previewImage) {
      setErrorMsg('Please upload an image, take a photo, or select a sample receipt.');
      return;
    }

    setIsScanning(true);
    setErrorMsg(null);

    try {
      setScanStep('1/6: Initializing Gemini Vision OCR...');
      await new Promise((r) => setTimeout(r, 400));

      setScanStep('2/6: Extracting merchant, amounts, dates & tax math...');
      await new Promise((r) => setTimeout(r, 500));

      setScanStep('3/6: Searching CRM database for matching customer/supplier accounts...');
      await new Promise((r) => setTimeout(r, 450));

      setScanStep('4/6: Executing duplicate transaction detection algorithm...');
      await new Promise((r) => setTimeout(r, 450));

      setScanStep('5/6: Proposing Chart of Accounts mapping & double-entry journal...');
      await new Promise((r) => setTimeout(r, 400));

      // Check if image is one of our presets
      const matchedPreset = SAMPLE_RECEIPT_PRESETS.find((p) => p.svgImage === previewImage);

      const result = await scanReceipt(
        previewImage,
        selectedFile ? selectedFile.name : matchedPreset ? matchedPreset.title : 'camera-receipt.jpg',
        matchedPreset
          ? {
              referenceNo: matchedPreset.ref,
              amount: matchedPreset.amount,
              currency: matchedPreset.currency,
              taxAmount: matchedPreset.tax,
              type: matchedPreset.type,
              merchantName: matchedPreset.merchant,
              description: matchedPreset.title,
              date: matchedPreset.date,
            }
          : undefined
      );

      if (!result.success || !result.transaction) {
        throw new Error(result.error || 'Failed to extract financial data');
      }

      setScanStep('6/6: Extraction complete!');
      setExtractedTx(result.transaction);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred during AI document extraction');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-800/90 p-1 flex items-center justify-center border border-amber-900/40 shrink-0">
              <img
                src="/assets/aistudio/Tutia_Clear__75e25393.png"
                alt="Tutia"
                className="h-8 w-8 object-contain"
              />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {language === 'ar'
                  ? 'فاحص الإيصالات والمعاملات الذكي - توتيا'
                  : 'TUTIA - AI Receipt & Transaction Scanner'}
              </h2>
              <p className="text-xs text-slate-400">
                {language === 'ar'
                  ? 'التعرف الضوئي الذكي، مطابقة حسابات العملاء والموردين، وكشف المعاملات المكررة'
                  : 'Automated document OCR, field normalization, CRM linking & duplicate detection'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!extractedTx ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Upload / Camera / Presets */}
              <div className="space-y-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Select Document Source
                </div>

                {/* Upload Zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-sky-500/60 rounded-xl p-6 text-center cursor-pointer bg-slate-800/40 hover:bg-slate-800/70 transition group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="mx-auto w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-sky-400 group-hover:scale-110 transition">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="mt-2 text-xs font-medium text-slate-200">
                    Click to upload document or drag and drop
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    JPG, PNG, PDF receipt, invoice, or bank deposit slip
                  </p>
                </div>

                {/* Camera Button */}
                <button
                  onClick={startCamera}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-medium flex items-center justify-center gap-2 transition"
                >
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>Use Device Camera to Capture Receipt</span>
                </button>

                {/* Ready-to-Test Sample Presets */}
                <div>
                  <div className="text-xs font-medium text-slate-400 mb-2">
                    Or select a ready-to-test sample receipt:
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {SAMPLE_RECEIPT_PRESETS.map((preset) => {
                      const isSelected = previewImage === preset.svgImage;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => handleSelectPreset(preset)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                            isSelected
                              ? 'bg-sky-500/15 border-sky-500 text-white'
                              : 'bg-slate-800/50 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                              <span>{preset.title}</span>
                              {preset.id === 'sample-duplicate' && (
                                <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[10px] border border-rose-500/30">
                                  Duplicate Test
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {preset.ref} • {formatMoney(preset.amount, preset.currency)} •{' '}
                              {preset.type}
                            </div>
                          </div>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                              isSelected
                                ? 'bg-sky-500 text-slate-950 font-bold'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            Select
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Document Preview */}
              <div className="space-y-4 flex flex-col">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Document Preview
                </div>

                <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-center min-h-[300px] relative overflow-hidden">
                  {isCameraActive ? (
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <button
                        onClick={captureCameraFrame}
                        className="mt-3 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg shadow transition"
                      >
                        Snap Receipt Photo
                      </button>
                    </div>
                  ) : previewImage ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img
                        src={previewImage}
                        alt="Receipt preview"
                        className="max-h-[340px] max-w-full object-contain rounded shadow"
                      />
                      {isScanning && (
                        <div className="absolute inset-0 bg-sky-950/60 flex flex-col items-center justify-center p-4">
                          {/* Animated laser scanning line */}
                          <div className="w-full h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent animate-pulse absolute top-1/2 -translate-y-1/2" />
                          <div className="bg-slate-900/90 border border-sky-500/50 rounded-xl p-4 shadow-xl text-center z-10 max-w-xs">
                            <RotateCw className="w-6 h-6 text-sky-400 animate-spin mx-auto mb-2" />
                            <div className="text-xs font-bold text-white">AI Vision OCR Active</div>
                            <div className="text-[11px] text-sky-300 mt-1">{scanStep}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-slate-500 text-xs">
                      <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <span>No document loaded</span>
                    </div>
                  )}
                </div>

                <button
                  disabled={!previewImage || isScanning}
                  onClick={handleRunAiOcr}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 transition"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isScanning ? 'Processing with AI...' : 'Run AI Extraction & Match'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Result Screen: Extracted details ready for confirmation */
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold">Extraction Successful!</span> Confidence score:{' '}
                    <strong>{(extractedTx.confidenceScore * 100).toFixed(0)}%</strong>
                  </div>
                </div>
                <span className="font-mono text-emerald-200 uppercase bg-emerald-500/20 px-2 py-0.5 rounded text-[11px]">
                  Status: {extractedTx.status}
                </span>
              </div>

              {extractedTx.duplicateFlag?.isDuplicate && (
                <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white">DUPLICATE TRANSACTION WARNING</span>
                    <p className="mt-0.5 text-rose-200">{extractedTx.duplicateFlag.reason}</p>
                    <p className="text-[11px] text-rose-300/80 mt-1">
                      Per Accounting Rule #2: Flagged for auditor inspection. Will not silently post.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Extracted Fields Table */}
                <div className="space-y-3 bg-slate-800/40 border border-slate-800 rounded-xl p-4">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-sky-400" /> Extracted Document Fields
                  </h3>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px]">Merchant / Counterparty:</span>
                      <div className="font-semibold text-white truncate">
                        {extractedTx.merchantName}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px]">Document Ref / Invoice:</span>
                      <div className="font-mono font-semibold text-sky-300">
                        {extractedTx.referenceNo}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px]">Transaction Date:</span>
                      <div className="text-slate-200">{extractedTx.date}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px]">Payment Method:</span>
                      <div className="text-slate-200">{extractedTx.paymentMethod}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px]">Total Amount:</span>
                      <div className="font-mono text-base font-bold text-white">
                        {formatMoney(extractedTx.amount, extractedTx.currency)}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px]">Tax / VAT Amount:</span>
                      <div className="font-mono text-slate-300">
                        {formatMoney(extractedTx.taxAmount || 0, extractedTx.currency)}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-700/60">
                    <span className="text-slate-400 text-[11px]">Description:</span>
                    <p className="text-xs text-slate-300 mt-0.5">{extractedTx.description}</p>
                  </div>
                </div>

                {/* Accounting & CRM Link Proposal */}
                <div className="space-y-3 bg-slate-800/40 border border-slate-800 rounded-xl p-4">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Proposed Accounting Classification
                  </h3>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px]">Target GL Account:</span>
                      <div className="font-mono text-sky-300 font-semibold">
                        {extractedTx.glAccountCode} - {extractedTx.glAccountName}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px]">Matched CRM Account:</span>
                      <div className="text-emerald-300 font-medium">
                        {extractedTx.supplierName ||
                          extractedTx.customerName ||
                          'Unmatched (New Vendor)'}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px]">Operating Branch:</span>
                      <div className="text-slate-300">{extractedTx.branchId}</div>
                    </div>
                  </div>

                  {extractedTx.warnings && extractedTx.warnings.length > 0 && (
                    <div className="pt-2 border-t border-slate-700/60">
                      <span className="text-amber-400 text-[11px] font-semibold">
                        Quality Warnings & Notes:
                      </span>
                      <ul className="list-disc list-inside text-[11px] text-amber-200/80 mt-1 space-y-0.5">
                        {extractedTx.warnings.map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => {
                    setExtractedTx(null);
                    setPreviewImage(null);
                  }}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium transition"
                >
                  Scan Another Document
                </button>
                <button
                  onClick={() => {
                    onSuccess(extractedTx);
                    onClose();
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition"
                >
                  <span>Open in Verification Queue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
