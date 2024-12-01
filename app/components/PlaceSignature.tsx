'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Check } from 'lucide-react'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

const PDF_FILE = '/sample.pdf'

export default function PlaceSignature() {
  const router = useRouter()
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [signature, setSignature] = useState<string | null>(null)
  const [position, setPosition] = useState({ x: 100, y: 100 })
  const [size, setSize] = useState({ width: 200, height: 100 })
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const signatureRef = useRef<HTMLDivElement>(null)
  const rotationStartAngle = useRef<number>(0)

  useEffect(() => {
    // Retrieve the signature from local storage
    const storedSignature = localStorage.getItem('signature')
    if (storedSignature) {
      setSignature(storedSignature)
    }

    const handleGlobalMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
      setIsRotating(false)
    }

    // Add global event listeners to handle mouse actions outside the container
    document.addEventListener('mouseup', handleGlobalMouseUp)
    document.addEventListener('mousemove', handleMouseMove)

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === signatureRef.current) {
      setIsDragging(true)
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && containerRef.current && signatureRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect()
      const newX = e.clientX - containerRect.left - size.width / 2
      const newY = e.clientY - containerRect.top - size.height / 2
      setPosition({ x: Math.max(newX, 0), y: Math.max(newY, 0) })
    } else if (isResizing && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect()
      const newWidth = e.clientX - containerRect.left - position.x
      const newHeight = e.clientY - containerRect.top - position.y
      setSize({ width: Math.max(newWidth, 50), height: Math.max(newHeight, 50) }) // Minimum size
    } else if (isRotating && containerRef.current && signatureRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect()
      const centerX = position.x + size.width / 2
      const centerY = position.y + size.height / 2
      const angle = Math.atan2(e.clientY - containerRect.top - centerY, e.clientX - containerRect.left - centerX)
      const angleInDegrees = angle * (180 / Math.PI)
      setRotation(angleInDegrees - rotationStartAngle.current)
    }
  }

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsResizing(true)
  }

  const handleRotateStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (containerRect) {
      const centerX = position.x + size.width / 2
      const centerY = position.y + size.height / 2
      const angle = Math.atan2(
        e.clientY - containerRect.top - centerY,
        e.clientX - containerRect.left - centerX
      )
      rotationStartAngle.current = angle * (180 / Math.PI)
    }
    setIsRotating(true)
  }

  const handleConfirm = () => {
    console.log('Signature placed:', { position, size, rotation })
    router.push('/request-loan/confirmation')
  }

  const handleBackClick = () => {
    router.back()
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-white to-pink-50">
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-pink-100 px-4 py-3 z-50">
        {/* App Bar */}
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button
            onClick={handleBackClick}
            className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center hover:bg-pink-100 transition-colors"
          >
            <Image
              src="/images/searchprofileicons/arrowbendleft.svg"
              alt="Back"
              width={24}
              height={24}
            />
          </button>
          <h1 className="text-lg font-semibold text-neutral-800">Place Signature</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 pt-16 px-4 pb-24 max-w-md mx-auto w-full">
        <div
          ref={containerRef}
          className="h-[70vh] w-[90%] max-w-md mx-auto overflow-auto relative border border-pink-100 rounded-lg bg-white"
        >
          <Document
            file={PDF_FILE}
            onLoadSuccess={onDocumentLoadSuccess}
            className="flex flex-col items-center"
          >
            <Page pageNumber={pageNumber} width={300} />
          </Document>
          {signature && (
            <div
              ref={signatureRef}
              style={{
                position: 'absolute',
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: `${size.width}px`,
                height: `${size.height}px`,
                transform: `rotate(${rotation}deg)`,
                cursor: isDragging ? 'grabbing' : 'grab',
                border: '1px solid pink',
              }}
              onMouseDown={handleMouseDown}
            >
              <img
                src={signature}
                alt="Signature"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
                draggable={false}
              />
              <div
                className="absolute bottom-0 right-0 w-4 h-4 bg-pink-500 cursor-se-resize"
                onMouseDown={handleResizeStart}
              />
              <div
                className="absolute top-0 left-0 w-4 h-4 bg-pink-500 cursor-pointer rounded-full"
                onMouseDown={handleRotateStart}
              />
            </div>
          )}
        </div>
        <div className="p-4 flex justify-between items-center">
          <button
            onClick={() => setPageNumber((page) => Math.max(page - 1, 1))}
            disabled={pageNumber <= 1}
            className="px-3 py-1 bg-pink-100 rounded-md text-pink-700 disabled:opacity-50"
          >
            Previous
          </button>
          <p className="text-sm text-neutral-600">
            Page {pageNumber} of {numPages}
          </p>
          <button
            onClick={() => setPageNumber((page) => Math.min(page + 1, numPages || 1))}
            disabled={pageNumber >= (numPages || 1)}
            className="px-3 py-1 bg-pink-100 rounded-md text-pink-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <button
          onClick={handleConfirm}
          className="mt-4 w-full py-2 bg-pink-500 text-white rounded-md shadow-md hover:bg-pink-600"
        >
          Confirm Signature <Check className="inline ml-2" />
        </button>
      </main>
    </div>
  )
}