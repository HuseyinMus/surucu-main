import React from 'react';

export default function TestPage() {
  const handleClick = () => {
    console.log('Butona tıklandı!');
    console.log('Tarih:', new Date().toLocaleString());
    alert('Buton çalışıyor! Console\'a bakın.');
  };

  console.log('TestPage render edildi');

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Test Sayfası</h1>
      <p>Bu sayfa çalışıyorsa React uygulaması normal çalışıyor demektir.</p>
      <button 
        onClick={handleClick}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: 'red', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: 'pointer',
          marginRight: '10px'
        }}
      >
        Console Test Butonu
      </button>
      
      <button 
        onClick={() => {
          console.log('İkinci buton tıklandı');
          document.body.style.backgroundColor = 'yellow';
        }}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: 'green', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Arka Plan Değiştir
      </button>
    </div>
  );
} 