import React from 'react'

export default function BoxLoader() {
  return (
    <div className="box-loader" aria-label="กำลังโหลด">
      <div className="boxes">
        {[1, 2, 3, 4].map((box) => (
          <div key={box} className={`box box-${box}`}>
            <div className="face face-front" />
            <div className="face face-right" />
            <div className="face face-top" />
            <div className="face face-back" />
          </div>
        ))}
      </div>
    </div>
  )
}
