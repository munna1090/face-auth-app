import { useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import Webcam from 'react-webcam'

/**
 * WebcamCapture component for capturing face images
 */
const WebcamCapture = forwardRef(({ onCapture, showGuide = true, status = '' }, ref) => {
    const webcamRef = useRef(null)

    const capture = useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot()
            if (imageSrc && onCapture) {
                onCapture(imageSrc)
            }
            return imageSrc
        }
        return null
    }, [onCapture])

    // Expose capture method to parent
    useImperativeHandle(ref, () => ({
        capture,
        getScreenshot: () => webcamRef.current?.getScreenshot()
    }))

    const videoConstraints = {
        width: 480,
        height: 360,
        facingMode: 'user'
    }

    return (
        <div className="webcam-container">
            <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                screenshotQuality={0.9}
                videoConstraints={videoConstraints}
                mirrored={false}
            />

            {showGuide && (
                <div className="webcam-overlay">
                    <div className="face-guide" />
                </div>
            )}

            {status && (
                <div className="webcam-status">{status}</div>
            )}
        </div>
    )
})

WebcamCapture.displayName = 'WebcamCapture'

export default WebcamCapture
