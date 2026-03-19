import { useState, useRef, useEffect } from 'react'
import QrScanner from 'qr-scanner'
import { Camera, Upload, X, CheckCircle, AlertCircle } from 'lucide-react'

const QRScanner = ({ onScan, onError }) => {
  const [scanMode, setScanMode] = useState('camera') // 'camera' or 'file'
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [error, setError] = useState('')
  const [uploadedFile, setUploadedFile] = useState(null)
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const qrScannerRef = useRef(null)

  const handleCameraScan = (result) => {
    if (result) {
      setScanResult(result)
      setIsScanning(false)
      onScan(result)
      setError('')
    }
  }

  const handleCameraError = (error) => {
    console.error('QR Scanner Error:', error)
    setError('Camera access denied or camera not available')
    setIsScanning(false)
    onError?.(error)
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      setError('')
      setUploadedFile(file)
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size exceeds 10MB limit')
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file')
      }

      const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true })
      setScanResult(result.data)
      onScan(result.data)
      setError('')
    } catch (err) {
      console.error('QR File Scan Error:', err)
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to scan QR code'
      if (err.message.includes('No QR code found')) {
        errorMessage = 'No QR code found in the image. Please try a clearer image with a visible QR code.'
      } else if (err.message.includes('File size')) {
        errorMessage = err.message
      } else if (err.message.includes('image file')) {
        errorMessage = err.message
      } else {
        errorMessage = 'Unable to read QR code from image. Please ensure the QR code is clear and well-lit.'
      }
      
      setError(errorMessage)
      setUploadedFile(null)
      onError?.(err)
    }
  }

  const startCameraScanning = async () => {
    setIsScanning(true)
    setScanMode('camera')
    setScanResult(null)
    setError('')

    try {
      // Initialize QR Scanner for camera
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => handleCameraScan(result.data),
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      )

      await qrScannerRef.current.start()
    } catch (err) {
      handleCameraError(err)
    }
  }

  const startFileUpload = () => {
    setScanMode('file')
    setIsScanning(false)
    setScanResult(null)
    setError('')
    fileInputRef.current?.click()
  }

  const resetScanner = () => {
    // Stop camera if running
    if (qrScannerRef.current) {
      qrScannerRef.current.stop()
      qrScannerRef.current = null
    }
    setScanResult(null)
    setError('')
    setIsScanning(false)
    setUploadedFile(null)
  }

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop()
      }
    }
  }, [])

  return (
    <div className="space-y-4">
      {/* Mode Selection */}
      <div className="flex gap-3">
        <button
          onClick={startCameraScanning}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
            scanMode === 'camera' && isScanning
              ? 'bg-brand-500 text-white'
              : 'bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/7'
          }`}
        >
          <Camera className="h-4 w-4" />
          Camera Scan
        </button>
        <button
          onClick={startFileUpload}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
            scanMode === 'file'
              ? 'bg-brand-500 text-white'
              : 'bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/7'
          }`}
        >
          <Upload className="h-4 w-4" />
          Upload Image
        </button>
        {scanResult && (
          <button
            onClick={resetScanner}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/25 hover:bg-rose-500/30 transition-colors"
          >
            <X className="h-4 w-4" />
            Reset
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/25 p-3">
          <div className="flex items-center gap-2 text-rose-300">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Success Display */}
      {scanResult && !error && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-3">
          <div className="flex items-center gap-2 text-emerald-300">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">QR Code scanned successfully!</span>
          </div>
        </div>
      )}

      {/* Camera Scanner */}
      {scanMode === 'camera' && isScanning && (
        <div className="relative">
          <video
            ref={videoRef}
            className="w-full h-64 bg-black rounded-3xl"
          />
        </div>
      )}

      {/* File Upload */}
      {scanMode === 'file' && (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-white/20 rounded-3xl p-8 text-center">
            <Upload className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
            <p className="text-zinc-300 mb-4">
              Upload an image containing a QR code
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors"
            >
              Choose File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            {/* Show uploaded file info */}
            {uploadedFile && (
              <div className="mt-4 p-3 bg-zinc-800/50 rounded-xl">
                <div className="text-sm text-zinc-300">
                  <div className="font-medium">{uploadedFile.name}</div>
                  <div className="text-xs text-zinc-500 mt-1">
                    Size: {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • Type: {uploadedFile.type}
                  </div>
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-zinc-500">
            Supported formats: JPG, PNG, GIF. Maximum file size: 10MB.
          </p>
        </div>
      )}

      {/* Instructions */}
      {!isScanning && !scanResult && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-4">
          <h4 className="text-amber-300 font-semibold mb-2">How to use:</h4>
          <ul className="text-amber-200 text-sm space-y-1">
            <li>• <strong>Camera Scan:</strong> Point your camera at the QR code</li>
            <li>• <strong>Upload Image:</strong> Select an image file containing the QR code</li>
            <li>• Ensure good lighting and clear QR code for best results</li>
            <li>• Hold steady until the QR code is detected</li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default QRScanner
