"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'
import Image from "next/image"

interface Document {
  name: string
  type: string
  url: string
  uploadDate: string
}

interface DocumentViewerModalProps {
  isOpen: boolean
  onClose: () => void
  documents: Document[]
  memberName: string
}

export function DocumentViewerModal({ isOpen, onClose, documents, memberName }: DocumentViewerModalProps) {
  const [selectedDoc, setSelectedDoc] = useState(0)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)

  const handleDownload = (doc: Document) => {
    // In a real app, this would trigger a download
    const link = document.createElement('a')
    link.href = doc.url
    link.download = doc.name
    link.click()
  }

  const resetView = () => {
    setZoom(100)
    setRotation(0)
  }

  if (!documents || documents.length === 0) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={`${memberName}'s Documents`}>
        <div className="p-6 text-center">
          <p className="text-gray-500">No documents available</p>
        </div>
      </Modal>
    )
  }

  const currentDoc = documents[selectedDoc]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${memberName}'s Documents`} className="max-w-4xl">
      <div className="flex h-[600px]">
        {/* Document List */}
        <div className="w-1/3 border-r bg-gray-50 p-4 overflow-y-auto">
          <h3 className="font-semibold mb-3">Documents ({documents.length})</h3>
          <div className="space-y-2">
            {documents.map((doc, index) => (
              <button
                key={index}
                onClick={() => {
                  setSelectedDoc(index)
                  resetView()
                }}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedDoc === index
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-sm">{doc.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {doc.type.toUpperCase()} • {doc.uploadDate}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Document Viewer */}
        <div className="flex-1 flex flex-col">
          {/* Controls */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setZoom(Math.max(50, zoom - 25))}
                variant="outline"
                size="sm"
                disabled={zoom <= 50}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium">{zoom}%</span>
              <Button
                onClick={() => setZoom(Math.min(200, zoom + 25))}
                variant="outline"
                size="sm"
                disabled={zoom >= 200}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setRotation((rotation + 90) % 360)}
                variant="outline"
                size="sm"
              >
                <RotateCw className="w-4 h-4" />
              </Button>
            </div>
            <Button
              onClick={() => handleDownload(currentDoc)}
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>

          {/* Document Display */}
          <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
            <div
              className="bg-white shadow-lg"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center',
                transition: 'transform 0.2s ease'
              }}
            >
              {currentDoc.type === 'pdf' ? (
                <div className="w-96 h-96 bg-white border flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📄</div>
                    <p className="text-gray-600">PDF Document</p>
                    <p className="text-sm text-gray-500">{currentDoc.name}</p>
                  </div>
                </div>
              ) : (
                <Image
                  src={currentDoc.url || "/placeholder.svg"}
                  alt={currentDoc.name}
                  width={400}
                  height={300}
                  className="max-w-none"
                  style={{ width: 'auto', height: 'auto' }}
                />
              )}
            </div>
          </div>

          {/* Document Info */}
          <div className="p-4 border-t bg-gray-50">
            <div className="text-sm">
              <p className="font-medium">{currentDoc.name}</p>
              <p className="text-gray-500">
                Uploaded on {currentDoc.uploadDate} • {currentDoc.type.toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
