import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        background: '#4F46E5',
        width: '100%',
        height: '100%',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: 20,
        fontWeight: 700,
        fontFamily: 'sans-serif',
      }}
    >
      F
    </div>,
    { ...size },
  )
}
